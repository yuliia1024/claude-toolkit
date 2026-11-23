// Tests for plugins/core/scripts/sync.mjs: copies rule areas from <toolkitPath>/rules
// into <project>/.claude/toolkit-rules/<area>/, leaving identical files untouched.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { cleanup, runScript, tempDir, writeTree } from './helpers/fs.mjs';

const SCRIPT = 'plugins/core/scripts/sync.mjs';

describe('sync', () => {
  let root;
  let project;
  let toolkit;
  beforeEach(() => {
    root = tempDir('sync-');
    project = join(root, 'project');
    toolkit = join(root, 'toolkit');
    writeTree(toolkit, {
      'rules/shared/style.md': '# style\n',
      'rules/backend/api.md': '# api\n',
      'rules/backend/notes.txt': 'not a rule\n',
      'rules/backend/nested/deep.md': '# nested, not copied\n',
      'rules/empty/.keep': '',
    });
  });
  afterEach(() => cleanup(root));

  const configure = (settings) => writeTree(project, { '.claude/toolkit.json': JSON.stringify(settings) });
  const sync = () => runScript(SCRIPT, [], { cwd: project, env: { CLAUDE_PROJECT_DIR: project } });
  const synced = (rel) => join(project, '.claude/toolkit-rules', rel);

  test('copies shared plus listed areas (top-level .md only)', () => {
    configure({ toolkitPath: '../toolkit', areas: ['backend'] });
    const r = sync();
    assert.equal(r.code, 0, r.stderr);
    assert.equal(readFileSync(synced('shared/style.md'), 'utf8'), '# style\n');
    assert.equal(readFileSync(synced('backend/api.md'), 'utf8'), '# api\n');
    assert.equal(existsSync(synced('backend/notes.txt')), false);
    assert.equal(existsSync(synced('backend/nested')), false);
    assert.match(r.stdout, /updated 2, unchanged 0, skipped areas 0/);
  });

  test('absolute toolkitPath and default areas (shared only)', () => {
    configure({ toolkitPath: toolkit });
    assert.equal(sync().code, 0);
    assert.ok(existsSync(synced('shared/style.md')));
    assert.equal(existsSync(synced('backend')), false);
  });

  test('is idempotent: unchanged files are not rewritten', () => {
    configure({ toolkitPath: '../toolkit', areas: ['backend'] });
    sync();
    const file = synced('backend/api.md');
    const past = new Date('2020-01-01T00:00:00Z');
    utimesSync(file, past, past);

    const r = sync();
    assert.equal(r.code, 0);
    assert.match(r.stdout, /updated 0, unchanged 2/);
    assert.equal(statSync(file).mtimeMs, past.getTime());
    assert.equal(readFileSync(file, 'utf8'), '# api\n');
  });

  test('changed source content is re-copied', () => {
    configure({ toolkitPath: '../toolkit', areas: ['backend'] });
    sync();
    writeTree(toolkit, { 'rules/backend/api.md': '# api v2\n' });
    const r = sync();
    assert.match(r.stdout, /updated 1, unchanged 1/);
    assert.equal(readFileSync(synced('backend/api.md'), 'utf8'), '# api v2\n');
  });

  test('unknown and empty areas are skipped with a warning', () => {
    configure({ toolkitPath: '../toolkit', areas: ['nope', 'empty', 'backend'] });
    const r = sync();
    assert.equal(r.code, 0);
    assert.match(r.stderr, /skip nope: not present/);
    assert.match(r.stderr, /skip empty: no \.md files/);
    assert.match(r.stdout, /skipped areas 2/);
    assert.equal(existsSync(synced('nope')), false);
    assert.ok(existsSync(synced('backend/api.md')));
  });

  test('missing config exits non-zero', () => {
    writeTree(project, { 'README.md': '' });
    const r = sync();
    assert.notEqual(r.code, 0);
    assert.match(r.stderr, /missing .*toolkit\.json/);
  });

  for (const [label, settings, rx] of [
    ['invalid JSON', null, /not valid JSON/],
    ['missing toolkitPath', { areas: [] }, /"toolkitPath"/],
    ['toolkitPath without rules/', { toolkitPath: '.' }, /expected a rules\/ folder/],
    ['area with path traversal', { toolkitPath: '../toolkit', areas: ['../x'] }, /"areas" must be a list/],
    ['areas not a list', { toolkitPath: '../toolkit', areas: 'backend' }, /"areas" must be a list/],
  ]) {
    test(`exits 1 on ${label}`, () => {
      if (settings === null) writeTree(project, { '.claude/toolkit.json': '{oops' });
      else configure(settings);
      const r = sync();
      assert.equal(r.code, 1);
      assert.match(r.stderr, rx);
      assert.equal(existsSync(synced('')), false);
    });
  }
});
