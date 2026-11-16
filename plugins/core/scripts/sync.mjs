#!/usr/bin/env node
// Rule sync: copy rule areas listed in .claude/toolkit.json from the toolkit checkout
// into <project>/.claude/toolkit-rules/<area>/. Files whose content is identical are left alone.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const project = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const settingsFile = join(project, '.claude', 'toolkit.json');
const destination = join(project, '.claude', 'toolkit-rules');

const die = (msg) => {
  console.error(`sync: ${msg}`);
  process.exit(1);
};

function loadSettings() {
  if (!existsSync(settingsFile)) die(`missing ${settingsFile} — run /core:setup first.`);
  try {
    return JSON.parse(readFileSync(settingsFile, 'utf8'));
  } catch (err) {
    return die(`${settingsFile} is not valid JSON: ${err.message}`);
  }
}

function resolveRulesSource(settings) {
  const raw = settings.toolkitPath;
  if (typeof raw !== 'string' || raw.trim() === '') {
    die(`"toolkitPath" in ${settingsFile} must be a non-empty path (absolute or relative to the project).`);
  }
  const rulesDir = join(resolve(project, raw), 'rules');
  if (!existsSync(rulesDir) || !statSync(rulesDir).isDirectory()) {
    die(`expected a rules/ folder at ${rulesDir}; check "toolkitPath".`);
  }
  return rulesDir;
}

function resolveAreas(settings) {
  const list = settings.areas === undefined ? ['shared'] : settings.areas;
  const valid = Array.isArray(list) && list.every((a) => typeof a === 'string' && /^[a-z0-9-]+$/.test(a));
  if (!valid) die('"areas" must be a list of names using only a-z, 0-9 and "-".');
  return [...new Set(['shared', ...list])];
}

const settings = loadSettings();
const rulesDir = resolveRulesSource(settings);
const stats = { written: 0, same: 0, missing: 0 };

for (const area of resolveAreas(settings)) {
  const from = resolve(rulesDir, area);
  if (!from.startsWith(rulesDir + sep)) die(`area "${area}" escapes the rules folder.`);
  if (!existsSync(from)) {
    console.warn(`  - skip ${area}: not present in the toolkit`);
    stats.missing += 1;
    continue;
  }
  const docs = readdirSync(from, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.md'));
  if (docs.length === 0) {
    console.warn(`  - skip ${area}: no .md files at its top level`);
    stats.missing += 1;
    continue;
  }
  const to = join(destination, area);
  mkdirSync(to, { recursive: true });
  for (const doc of docs) {
    const body = readFileSync(join(from, doc.name), 'utf8');
    const out = join(to, doc.name);
    if (existsSync(out) && readFileSync(out, 'utf8') === body) {
      stats.same += 1;
      continue;
    }
    writeFileSync(out, body, 'utf8');
    console.log(`  + ${area}/${doc.name}`);
    stats.written += 1;
  }
}

console.log(`\nsync done — updated ${stats.written}, unchanged ${stats.same}, skipped areas ${stats.missing}`);
console.log(`target: ${destination}`);
