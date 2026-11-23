// Tests for plugins/core/scripts/validate-toolkit.mjs: runs against the real repo and
// against small temp toolkits pointed to by TOOLKIT_ROOT.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { cleanup, repoRoot, runScript, tempDir, writeTree } from './helpers/fs.mjs';

const SCRIPT = 'plugins/core/scripts/validate-toolkit.mjs';

const healthy = {
  '.claude-plugin/marketplace.json': JSON.stringify({
    name: 't',
    plugins: [{ name: 'alpha', source: './plugins/alpha' }],
  }),
  'plugins/alpha/.claude-plugin/plugin.json': JSON.stringify({ name: 'alpha' }),
  'plugins/alpha/hooks/hooks.json': JSON.stringify({ hooks: {} }),
  'plugins/alpha/skills/do-thing/SKILL.md': '---\nname: do-thing\ndescription: Does the thing.\n---\nSee [ref](./ref.md).\n',
  'plugins/alpha/skills/do-thing/ref.md': '# ref\n',
  'rules/shared/style.md': '---\npaths:\n  - "**/*"\n---\n# style\n',
};

describe('validate-toolkit', () => {
  let root;
  beforeEach(() => { root = tempDir('validate-toolkit-'); });
  afterEach(() => cleanup(root));

  const validate = (files) => {
    writeTree(root, { ...healthy, ...files });
    return runScript(SCRIPT, [], { cwd: root, env: { TOOLKIT_ROOT: root } });
  };

  test('the real repository has no errors', () => {
    const r = runScript(SCRIPT, [], { cwd: repoRoot, env: { TOOLKIT_ROOT: '' } });
    assert.equal(r.code, 0, r.stdout);
    assert.match(r.stdout, /validate-toolkit: 0 error\(s\)/);
  });

  test('a healthy temp toolkit is clean', () => {
    const r = validate({});
    assert.equal(r.code, 0, r.stdout);
    assert.match(r.stdout, /0 error\(s\), 0 warning\(s\)/);
  });

  for (const [label, files, rx] of [
    ['invalid plugin.json', { 'plugins/alpha/.claude-plugin/plugin.json': '{ nope' }, /ERROR plugins\/alpha\/\.claude-plugin\/plugin\.json: invalid JSON/],
    ['invalid hooks.json', { 'plugins/alpha/hooks/hooks.json': '[' }, /ERROR plugins\/alpha\/hooks\/hooks\.json: invalid JSON/],
    ['skill without description', { 'plugins/alpha/skills/do-thing/SKILL.md': '---\nname: do-thing\n---\n' }, /ERROR .*do-thing\/SKILL\.md: frontmatter lacks "description"/],
    ['skill without name', { 'plugins/alpha/skills/do-thing/SKILL.md': '---\ndescription: x\n---\n' }, /ERROR .*frontmatter lacks "name"/],
    ['marketplace source without plugin.json', {
      '.claude-plugin/marketplace.json': JSON.stringify({ plugins: [{ name: 'ghost', source: './plugins/ghost' }] }),
    }, /ERROR marketplace\.json: "ghost" source "plugins\/ghost" has no \.claude-plugin\/plugin\.json/],
    ['duplicate marketplace plugin', {
      '.claude-plugin/marketplace.json': JSON.stringify({
        plugins: [{ name: 'alpha', source: './plugins/alpha' }, { name: 'alpha', source: './plugins/alpha' }],
      }),
    }, /ERROR marketplace\.json: duplicate plugin "alpha"/],
  ]) {
    test(`exits 1 on ${label}`, () => {
      const r = validate(files);
      assert.equal(r.code, 1, r.stdout);
      assert.match(r.stdout, rx);
    });
  }

  for (const [label, files, rx] of [
    ['skill name differing from its folder', { 'plugins/alpha/skills/do-thing/SKILL.md': '---\nname: other\ndescription: x\n---\n' }, /WARN .*name "other" differs from folder "do-thing"/],
    ['broken relative link', { 'plugins/alpha/README.md': '[x](./missing.md) [web](https://example.com) [anchor](#top)' }, /WARN .*broken link "\.\/missing\.md"/],
    ['rule without paths:', { 'rules/backend/api.md': '# api\n' }, /WARN +rules\/backend\/api\.md: missing `paths:`/],
  ]) {
    test(`warns but exits 0 on ${label}`, () => {
      const r = validate(files);
      assert.equal(r.code, 0, r.stdout);
      assert.match(r.stdout, rx);
      assert.match(r.stdout, /0 error\(s\), 1 warning\(s\)/);
    });
  }
});
