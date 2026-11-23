// Structural invariants of the toolkit repository itself (read-only).
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { repoRoot } from './helpers/fs.mjs';

const rel = (abs) => relative(repoRoot, abs).split('\\').join('/');
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const subdirs = (dir) => (isDir(dir) ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => join(dir, e.name)) : []);
const frontmatter = (text) => /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? null;

function walk(dir, keep) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, keep));
    else if (keep(entry.name)) out.push(p);
  }
  return out;
}

describe('repo integrity', () => {
  test('every rule declares `paths:` frontmatter or lives in rules/shared/', () => {
    const rules = walk(join(repoRoot, 'rules'), (n) => n.endsWith('.md'));
    assert.ok(rules.length > 0);
    const unscoped = rules.filter((file) => {
      if (rel(file).startsWith('rules/shared/')) return false;
      const fm = frontmatter(readFileSync(file, 'utf8'));
      return fm === null || !/^paths:\s*$/m.test(fm);
    });
    assert.deepEqual(unscoped.map(rel), []);
  });

  test('every SKILL.md `name` equals its folder name', () => {
    const skills = walk(join(repoRoot, 'plugins'), (n) => n === 'SKILL.md');
    assert.ok(skills.length > 0);
    const mismatched = skills
      .map((file) => ({ file: rel(file), folder: basename(dirname(file)), name: /^name:\s*(.+)$/m.exec(frontmatter(readFileSync(file, 'utf8')) ?? '')?.[1]?.trim() }))
      .filter((s) => s.name !== s.folder);
    assert.deepEqual(mismatched, []);
  });

  test('every marketplace plugin source exists and has a plugin.json', () => {
    const listing = JSON.parse(readFileSync(join(repoRoot, '.claude-plugin', 'marketplace.json'), 'utf8'));
    assert.ok(listing.plugins.length > 0);
    const missing = listing.plugins
      .filter((p) => !existsSync(join(repoRoot, p.source, '.claude-plugin', 'plugin.json')))
      .map((p) => `${p.name} -> ${p.source}`);
    assert.deepEqual(missing, []);
  });

  test('every eval case has prompt.md and graders/ with at least one .md', (t) => {
    // plugins/<plugin>/evals/<case>/; results/ holds run output (git-ignored), not a case.
    const cases = subdirs(join(repoRoot, 'plugins'))
      .flatMap((plugin) => subdirs(join(plugin, 'evals')))
      .filter((dir) => basename(dir) !== 'results');
    if (cases.length === 0) {
      t.skip('no plugins/*/evals/*/ cases yet');
      return;
    }
    const problems = [];
    for (const dir of cases) {
      if (!existsSync(join(dir, 'prompt.md'))) problems.push(`${rel(dir)}: missing prompt.md`);
      const graders = join(dir, 'graders');
      const mds = isDir(graders) ? readdirSync(graders).filter((n) => n.endsWith('.md')) : [];
      if (mds.length === 0) problems.push(`${rel(dir)}: graders/ missing or has no .md`);
    }
    assert.deepEqual(problems, []);
  });
});
