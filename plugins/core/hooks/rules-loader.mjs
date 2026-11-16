#!/usr/bin/env node
// PreToolUse hook (Edit/Write/MultiEdit).
//
// Reads the hook payload from stdin, works out which synced rule files in
// .claude/toolkit-rules apply to the file about to be edited, and returns the ones
// this session has not received yet as `additionalContext`.
//
// Matching:
//   - a rule whose frontmatter has a `paths:` list applies when any glob matches
//     the target path (relative to the project, forward slashes);
//   - a rule without `paths:` applies to everything, but only if it lives in shared/.
// Delivered rule ids are remembered per session in .claude/.toolkit-cache/<id>.json.
// Any failure is swallowed: the hook must never block an edit.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const rulesRoot = join(projectRoot, '.claude', 'toolkit-rules');
const seenRoot = join(projectRoot, '.claude', '.toolkit-cache');

const toPosix = (p) => p.split(sep).join('/');

function safeParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function* markdownFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* markdownFiles(p);
    else if (entry.name.endsWith('.md')) yield p;
  }
}

// Returns the `paths:` globs from YAML frontmatter, or null when the key is absent.
function pathGlobs(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end < 0) return null;
  const header = text.slice(3, end).split(/\r?\n/);
  const start = header.findIndex((line) => line.trim() === 'paths:');
  if (start < 0) return null;
  const out = [];
  for (let k = start + 1; k < header.length; k++) {
    const item = /^\s+-\s+(.*\S)\s*$/.exec(header[k]) || /^-\s+(.*\S)\s*$/.exec(header[k]);
    if (!item) break;
    out.push(item[1].replace(/^(['"])(.*)\1$/, '$2'));
  }
  return out;
}

// Glob syntax supported: `**/` (any number of directories), `**` (anything), `*` (one segment).
function compileGlob(glob) {
  const special = new Set([...'.+?^$()[]{}|\\']);
  let src = '';
  let k = 0;
  while (k < glob.length) {
    if (glob.startsWith('**/', k)) {
      src += '(?:[^]*/)?';
      k += 3;
    } else if (glob.startsWith('**', k)) {
      src += '[^]*';
      k += 2;
    } else if (glob[k] === '*') {
      src += '[^/]*';
      k += 1;
    } else {
      src += special.has(glob[k]) ? `\\${glob[k]}` : glob[k];
      k += 1;
    }
  }
  return new RegExp(`^${src}$`);
}

function run() {
  const input = safeParse(readFileSync(0, 'utf8'), {});
  const target = input?.tool_input?.file_path;
  if (!target || !existsSync(rulesRoot)) return;

  const targetRel = toPosix(relative(projectRoot, resolve(projectRoot, target)));
  if (targetRel.startsWith('.claude/')) return; // editing toolkit config: nothing to inject

  const seenFile = join(seenRoot, `${input.session_id || 'default'}.json`);
  const seen = new Set(existsSync(seenFile) ? safeParse(readFileSync(seenFile, 'utf8'), []) : []);

  const fresh = [];
  for (const file of markdownFiles(rulesRoot)) {
    const id = relative(rulesRoot, file);
    if (seen.has(id)) continue;
    const body = readFileSync(file, 'utf8');
    const globs = pathGlobs(body);
    const relevant = globs === null
      ? toPosix(id).startsWith('shared/')
      : globs.some((g) => compileGlob(g).test(targetRel));
    if (!relevant) continue;
    fresh.push(`<rule file="${id}">\n${body}\n</rule>`);
    seen.add(id);
  }
  if (!fresh.length) return;

  mkdirSync(seenRoot, { recursive: true });
  writeFileSync(seenFile, JSON.stringify([...seen]));

  const additionalContext = `Project rules for ${targetRel} (follow them in this edit):\n\n${fresh.join('\n\n')}`;
  const hookEventName = process.argv[2] || 'PreToolUse';
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext } }));
}

try {
  run();
} catch {
  // stay silent; the edit proceeds without injected rules
}
