// Tests for plugins/core/hooks/rules-loader.mjs (PreToolUse hook).
// The hook reads a JSON payload on stdin and, when rules apply, prints
// { hookSpecificOutput: { hookEventName, additionalContext } }. It must never fail an edit.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { cleanup, runScript, tempDir, writeTree } from './helpers/fs.mjs';

const SCRIPT = 'plugins/core/hooks/rules-loader.mjs';

const RULES = {
  '.claude/toolkit-rules/shared/working-style.md': '# Working style\nBe concise.\n',
  '.claude/toolkit-rules/backend-node/nestjs.md':
    '---\npaths:\n  - "src/**/*.ts"\n  - \'apps/*/main.ts\'\n---\n# NestJS rule\n',
  '.claude/toolkit-rules/security/sql.md': '---\npaths:\n  - "**/*.sql"\n---\n# SQL rule\n',
  // An unscoped rule outside shared/ applies to nothing.
  '.claude/toolkit-rules/ai/unscoped.md': '# Unscoped AI rule\n',
};

describe('rules-loader hook', () => {
  let project;
  beforeEach(() => {
    project = tempDir('rules-loader-');
    writeTree(project, RULES);
  });
  afterEach(() => cleanup(project));

  /** Runs the hook with a payload (object -> JSON, string -> raw stdin). */
  const hook = (payload, args = []) => runScript(SCRIPT, args, {
    cwd: project,
    env: { CLAUDE_PROJECT_DIR: project },
    input: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
  const edit = (filePath, session = 's1') => ({ session_id: session, tool_name: 'Edit', tool_input: { file_path: filePath } });
  const contextOf = (r) => JSON.parse(r.stdout).hookSpecificOutput.additionalContext;

  test('injects matching scoped rules plus shared rules, but not non-matching ones', () => {
    const r = hook(edit(join(project, 'src/orders/orders.service.ts')));
    assert.equal(r.code, 0);
    const out = JSON.parse(r.stdout);
    assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse');
    const ctx = out.hookSpecificOutput.additionalContext;
    assert.match(ctx, /^Project rules for src\/orders\/orders\.service\.ts/);
    assert.match(ctx, /<rule file="backend-node\/nestjs\.md">[\s\S]*# NestJS rule/);
    assert.match(ctx, /<rule file="shared\/working-style\.md">[\s\S]*Be concise\./);
    assert.doesNotMatch(ctx, /SQL rule/);
    assert.doesNotMatch(ctx, /Unscoped AI rule/);
  });

  test('accepts project-relative paths and single-segment `*` globs', () => {
    const ctx = contextOf(hook(edit('apps/api/main.ts')));
    assert.match(ctx, /NestJS rule/);
    // `*` does not cross a directory boundary.
    const deeper = contextOf(hook(edit('apps/api/nested/main.ts', 's2')));
    assert.doesNotMatch(deeper, /NestJS rule/);
  });

  test('`**/` matches at any depth, including the root', () => {
    assert.match(contextOf(hook(edit('schema.sql'))), /SQL rule/);
    assert.match(contextOf(hook(edit('db/migrations/001.sql', 's2'))), /SQL rule/);
  });

  test('a second edit in the same session does not repeat delivered rules', () => {
    const file = join(project, 'src/a.ts');
    assert.match(contextOf(hook(edit(file))), /NestJS rule/);
    const again = hook(edit(join(project, 'src/b.ts')));
    assert.equal(again.code, 0);
    assert.equal(again.stdout, '');

    const cache = JSON.parse(readFileSync(join(project, '.claude/.toolkit-cache/s1.json'), 'utf8'));
    assert.deepEqual(cache.sort(), [join('backend-node', 'nestjs.md'), join('shared', 'working-style.md')].sort());

    // Only rules not yet delivered are sent: the SQL rule still arrives.
    const sql = contextOf(hook(edit('x.sql')));
    assert.match(sql, /SQL rule/);
    assert.doesNotMatch(sql, /NestJS rule|Be concise/);
  });

  test('a different session gets the rules again', () => {
    hook(edit('src/a.ts', 'one'));
    assert.match(contextOf(hook(edit('src/a.ts', 'two'))), /NestJS rule/);
  });

  test('edits under .claude/ are skipped', () => {
    const r = hook(edit(join(project, '.claude/toolkit-rules/shared/working-style.md')));
    assert.equal(r.code, 0);
    assert.equal(r.stdout, '');
    assert.equal(existsSync(join(project, '.claude/.toolkit-cache')), false);
  });

  test('hookEventName comes from argv[2] when given', () => {
    const r = hook(edit('src/a.ts'), ['PostToolUse']);
    assert.equal(JSON.parse(r.stdout).hookSpecificOutput.hookEventName, 'PostToolUse');
  });

  test('no rules folder means no output', () => {
    cleanup(join(project, '.claude'));
    const r = hook(edit('src/a.ts'));
    assert.equal(r.code, 0);
    assert.equal(r.stdout, '');
  });

  for (const [label, payload] of [
    ['malformed JSON', '{not json'],
    ['empty stdin', ''],
    ['JSON null', 'null'],
    ['no tool_input', '{"session_id":"s"}'],
    ['non-string file_path', '{"tool_input":{"file_path":42}}'],
  ]) {
    test(`never blocks on ${label}`, () => {
      const r = hook(payload);
      assert.equal(r.code, 0);
      assert.equal(r.stderr, '');
    });
  }
});
