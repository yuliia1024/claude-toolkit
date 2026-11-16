#!/usr/bin/env node
// Static checks for the toolkit repository: manifests parse, marketplace entries resolve,
// skills carry name/description, relative Markdown links resolve, rules declare `paths:`.
// Exit code 1 when any error is found; warnings never fail the run.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const toolkitRoot = resolve(process.env.TOOLKIT_ROOT || join(scriptDir, '..', '..', '..'));

const problems = { error: [], warn: [] };
const report = (level, file, msg) => problems[level].push(`${file}: ${msg}`);

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

const posix = (abs) => relative(toolkitRoot, abs).split(sep).join('/');
const text = (abs) => readFileSync(abs, 'utf8');
const frontmatterOf = (src) => /^---\r?\n([\s\S]*?)\r?\n---/.exec(src)?.[1] ?? null;

const all = listFiles(toolkitRoot).map((abs) => ({ abs, rel: posix(abs) }));

// 1. JSON manifests and hook configs must parse.
for (const f of all) {
  const isManifest = f.rel.endsWith('.json') && (f.rel.includes('.claude-plugin/') || f.rel.endsWith('hooks.json'));
  if (!isManifest) continue;
  try {
    JSON.parse(text(f.abs));
  } catch (err) {
    report('error', f.rel, `invalid JSON (${err.message})`);
  }
}

// 2. Marketplace: unique names, each source has a plugin manifest.
const marketplaceFile = join(toolkitRoot, '.claude-plugin', 'marketplace.json');
if (existsSync(marketplaceFile)) {
  let listing = null;
  try {
    listing = JSON.parse(text(marketplaceFile));
  } catch {
    listing = null; // already reported by check 1
  }
  const seen = new Set();
  for (const entry of listing?.plugins ?? []) {
    if (seen.has(entry.name)) report('error', 'marketplace.json', `duplicate plugin "${entry.name}"`);
    seen.add(entry.name);
    const src = typeof entry.source === 'string' ? entry.source.replace(/^\.\//, '') : '';
    if (!src || !existsSync(join(toolkitRoot, src, '.claude-plugin', 'plugin.json'))) {
      report('error', 'marketplace.json', `"${entry.name}" source "${src || '(missing)'}" has no .claude-plugin/plugin.json`);
    }
  }
}

// 3. Skills: frontmatter name + description, name equal to folder.
for (const f of all.filter((x) => x.rel.endsWith('/SKILL.md'))) {
  const fm = frontmatterOf(text(f.abs)) ?? '';
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  if (!name) report('error', f.rel, 'frontmatter lacks "name"');
  if (!/^description:\s*\S/m.test(fm)) report('error', f.rel, 'frontmatter lacks "description"');
  const folder = basename(dirname(f.abs));
  if (name && name !== folder) report('warn', f.rel, `name "${name}" differs from folder "${folder}"`);
}

// 4. Relative links inside Markdown must point at something that exists.
for (const f of all.filter((x) => x.rel.endsWith('.md'))) {
  for (const [, href] of text(f.abs).matchAll(/\]\(([^)]+)\)/g)) {
    const local = href.split('#')[0];
    if (!local || local.startsWith('$') || /^[a-z]+:/i.test(local)) continue;
    if (!existsSync(resolve(dirname(f.abs), local))) report('warn', f.rel, `broken link "${local}"`);
  }
}

// 5. Rules should be scoped with `paths:`; unscoped rules are only picked up from shared/.
for (const f of all.filter((x) => x.rel.startsWith('rules/'))) {
  const fm = frontmatterOf(text(f.abs));
  if (fm === null || !/^paths:\s*$/m.test(fm)) {
    report('warn', f.rel, 'missing `paths:` frontmatter (only loaded when under shared/)');
  }
}

for (const msg of problems.error) console.log(`ERROR ${msg}`);
for (const msg of problems.warn) console.log(`WARN  ${msg}`);
console.log(`\nvalidate-toolkit: ${problems.error.length} error(s), ${problems.warn.length} warning(s)`);
process.exitCode = problems.error.length > 0 ? 1 : 0;
