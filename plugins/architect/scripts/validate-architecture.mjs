#!/usr/bin/env node
/**
 * Consistency gate for block-structured architecture docs.
 *
 * The architect skills generate a docs tree like this:
 *
 *   <docs>/
 *     api-contract/README.md, api-contract/<slug>.md      shared endpoint specs
 *     data-model/README.md,   data-model/<slug>.md        shared entity specs
 *     <slug>/README.md                                    overview + Block Index + Dependency Map
 *     <slug>/NN-<name>.md                                 numbered blocks
 *     <slug>/tasks/README.md, <slug>/tasks/NN-<name>.md   task index + task specs
 *   <docs>/../progress/<slug>/*.md                         tracking files (links are checked too)
 *
 * Cross-file promises (index rows vs. files, links vs. headings, task waves vs. dependencies)
 * are tedious to confirm by reading, so this tool confirms them and the skills only run it.
 * Plain Node, no packages.
 *
 * Usage
 *   validate-architecture.mjs [docs-dir] [--feature <slug>] [--json] [--inventory] [--warnings-as-errors]
 *
 *   docs-dir              optional; otherwise read from .claude/toolkit.json
 *                         (paths.architectureDocs) or guessed (docs/architecture2, docs/architecture)
 *   --feature <slug>      limit the run to one feature folder
 *   --json                machine-readable report: { docsRoot, features, errors, warnings, findings[] }
 *   --inventory           print what the docs declare (endpoints, entities, tasks) as JSON and stop
 *   --warnings-as-errors  any warning also fails the run
 *
 * Exit status: 0 clean (warnings allowed), 1 at least one error, 2 nothing to validate.
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── options ──────────────────────────────────────────────────────────────────

function readOptions(argv) {
  const o = { dir: null, feature: null, json: false, inventory: false, failOnWarn: false, help: false };
  for (let k = 0; k < argv.length; k++) {
    const a = argv[k];
    switch (a) {
      case '--feature': o.feature = argv[++k] ?? null; break;
      case '--json': o.json = true; break;
      case '--inventory': o.inventory = true; break;
      case '--warnings-as-errors': o.failOnWarn = true; break;
      case '-h': case '--help': o.help = true; break;
      default:
        if (a.startsWith('--feature=')) o.feature = a.slice(10);
        else if (!a.startsWith('-') && !o.dir) o.dir = a;
    }
  }
  return o;
}

const HELP = `Checks an architecture docs tree for broken cross-references.

  validate-architecture.mjs [docs-dir] [--feature <slug>] [--json] [--inventory] [--warnings-as-errors]

Exit status 0 = no errors, 1 = errors found, 2 = docs tree not found.`;

// ─── tunables ─────────────────────────────────────────────────────────────────

const LIMITS = { blockLines: 200, taskLines: 100, tasksPerWave: 5, singleTaskWaveStreak: 3 };
const SHARED_KINDS = ['api-contract', 'data-model'];
const BLOCK_FILE = /^(\d+[a-z]?)-.+\.md$/;
// Files and folders a feature dir may hold besides numbered blocks.
const ALLOWED_EXTRA_FILES = ['README.md', '_worklog.md', '_progress.md', '_impact.md', '_reconcile.md'];
const ALLOWED_EXTRA_DIRS = ['tasks'];
// Scope column: a base token, optionally followed by "(qualifier)". Routing uses only the base.
const SCOPE_TOKENS = ['contracts', 'BE'];

// Template slots that must never survive into generated docs. Kept as an explicit list (not a
// generic brace pattern) because real docs legitimately contain `{ id }`, `${X}`, generics, etc.
const UNFILLED_SLOTS = [
  'YYYY-MM-DD', 'Feature Name', 'feature-slug', 'other-feature', 'Other feature', 'docs-root',
  'NN', 'S/M/L', 'METHOD', '/path', 'table_name', 'which app', 'what is missing',
  'validation-file', 'business-logic-file',
].map((s) => `{${s}}`).concat(['{Domain}ValidationCode']);

const OVERVIEW_SECTIONS = [
  { label: 'Overview', words: ['overview'] },
  { label: 'Scope', words: ['scope'] },
  { label: 'Assumptions', words: ['assumptions', 'decisions'] },
  { label: 'Block Index', words: ['block index'] },
  { label: 'Dependency Map', words: ['dependency map'] },
];

// ─── markdown model ───────────────────────────────────────────────────────────

const docCache = new Map();

class MdFile {
  static open(file) {
    const key = path.resolve(file);
    if (!docCache.has(key)) docCache.set(key, new MdFile(key));
    return docCache.get(key);
  }

  constructor(file) {
    this.file = file;
    this.raw = fs.readFileSync(file, 'utf8');
    this.lines = MdFile.blankCode(this.raw.split('\n'));
    this.prose = this.lines.join('\n');
  }

  // Code fences hold sample payloads and diagrams; replace their lines with '' so line numbers stay put.
  static blankCode(src) {
    let open = null;
    return src.map((ln) => {
      const t = ln.trimStart();
      const marker = t.startsWith('```') ? '`' : t.startsWith('~~~') ? '~' : null;
      if (open === null && marker) { open = marker; return ''; }
      if (open !== null) { if (marker === open) open = null; return ''; }
      return ln;
    });
  }

  get nonEmptyLength() {
    const all = this.raw.split('\n');
    if (all.length && all[all.length - 1] === '') all.pop();
    return all.length;
  }

  get headings() {
    if (!this._heads) {
      this._heads = [];
      this.lines.forEach((ln, at) => {
        let lvl = 0;
        while (ln[lvl] === '#') lvl++;
        if (lvl >= 1 && lvl <= 6 && (ln[lvl] === ' ' || ln[lvl] === '\t')) {
          this._heads.push({ level: lvl, title: ln.slice(lvl).trim(), at });
        }
      });
    }
    return this._heads;
  }

  get anchors() {
    if (!this._anchors) {
      this._anchors = new Set();
      const used = {};
      for (const h of this.headings) {
        const custom = /\{#([A-Za-z0-9_-]+)\}\s*$/.exec(h.title);
        if (custom) { this._anchors.add(custom[1].toLowerCase()); continue; }
        const s = githubSlug(h.title);
        if (!s) continue;
        const dup = used[s] || 0;
        used[s] = dup + 1;
        this._anchors.add(dup ? `${s}-${dup}` : s);
      }
    }
    return this._anchors;
  }

  // Relative links only: [text](target#frag "title")
  get relativeLinks() {
    const out = [];
    const rx = /\]\(\s*([^\s)]+)[^)]*\)/g;
    for (const hit of this.prose.matchAll(rx)) {
      const href = hit[1];
      if (href.startsWith('#') || href.startsWith('<') || /^[a-z][a-z+.-]*:/i.test(href)) continue;
      const cut = href.indexOf('#');
      const target = cut < 0 ? href : href.slice(0, cut);
      if (!target) continue;
      out.push({ href, target: safeDecode(target), fragment: cut < 0 ? null : safeDecode(href.slice(cut + 1)) });
    }
    return out;
  }

  // Lines between a heading and the next heading of equal or higher rank.
  sectionBody(head) {
    const next = this.headings.find((h) => h.at > head.at && h.level <= head.level);
    return this.lines.slice(head.at + 1, next ? next.at : this.lines.length);
  }

  findHeading(test) {
    return this.headings.find((h) => test(h.title));
  }

  // First pipe table after the given heading (stops at the next heading once a table started).
  tableAfter(head) {
    if (!head) return null;
    const rows = [];
    for (let k = head.at + 1; k < this.lines.length; k++) {
      const t = this.lines[k].trim();
      if (t.startsWith('|')) { rows.push(splitRow(t)); continue; }
      if (rows.length) break;
    }
    if (!rows.length) return null;
    const sep = rows.findIndex((r) => r.every((c) => /^:?-{1,}:?$/.test(c) || c === ''));
    if (sep < 0) return { columns: [], body: rows };
    return { columns: rows.slice(0, sep).pop() || [], body: rows.slice(sep + 1) };
  }
}

function splitRow(t) {
  let s = t;
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

function plainText(cell = '') {
  return cell.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '').trim();
}

function linkTarget(cell = '') {
  const m = /\]\(([^\s)]+)/.exec(cell);
  return m ? m[1] : null;
}

// GitHub-style anchor: lowercase, keep [a-z0-9_-], each whitespace char -> '-', drop the rest.
function githubSlug(title) {
  const text = plainText(title).toLowerCase();
  let out = '';
  for (const ch of text) {
    if (/[a-z0-9_-]/.test(ch)) out += ch;
    else if (/\s/.test(ch)) out += '-';
  }
  return out;
}

function columnIndex(columns, ...aliases) {
  const squash = (s) => plainText(s).toLowerCase().replace(/[^a-z#]/g, '');
  const want = new Set(aliases.map(squash));
  return columns.findIndex((c) => want.has(squash(c)));
}

const leadingNumber = (s) => (/^(\d+[a-z]?)(?![\w])/.exec(plainText(s)) || [])[1] || null;

// ─── findings ─────────────────────────────────────────────────────────────────

class Ledger {
  constructor() { this.items = []; this.keys = new Set(); }
  push(level, feature, check, message, file) {
    const id = [level, feature, check, message].join('\u0000');
    if (this.keys.has(id)) return;
    this.keys.add(id);
    this.items.push({ level, feature, check, message, file });
  }
  scoped(feature, check) {
    return {
      error: (msg, file) => this.push('error', feature, check, msg, file),
      warn: (msg, file) => this.push('warning', feature, check, msg, file),
    };
  }
  count(level) { return this.items.filter((i) => i.level === level).length; }
}

// ─── per-feature view ─────────────────────────────────────────────────────────

class Feature {
  constructor(root, slug) {
    this.root = root;
    this.slug = slug;
    this.dir = path.join(root, slug);
    this.readmePath = path.join(this.dir, 'README.md');
    this.readme = fs.existsSync(this.readmePath) ? MdFile.open(this.readmePath) : null;
    this.blocks = listNumbered(this.dir);
    this.tasksDir = path.join(this.dir, 'tasks');
    this.taskFiles = listNumbered(this.tasksDir);
    this.roles = new Map(); // filled by the block-index check
  }

  shared(kind) { return path.join(this.root, kind, `${this.slug}.md`); }
  rel(p) { return path.relative(this.root, p); }
  blockFor(role, nameTest) {
    // A Block Index row may link a file that does not exist (reported by 'structure'); ignore it here.
    const indexed = this.roles.get(role);
    if (indexed && fs.existsSync(path.join(this.dir, indexed))) return indexed;
    return this.blocks.find((b) => nameTest.test(b)) || null;
  }

  markdownFiles() {
    const found = [];
    const walk = (d, depth) => {
      if (depth > 2 || !fs.existsSync(d)) return;
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, ent.name);
        if (ent.isDirectory()) walk(p, depth + 1);
        else if (ent.name.endsWith('.md')) found.push(p);
      }
    };
    walk(this.dir, 0);
    const tracking = path.join(path.dirname(this.root), 'progress', this.slug);
    if (fs.existsSync(tracking)) {
      for (const n of fs.readdirSync(tracking)) if (n.endsWith('.md')) found.push(path.join(tracking, n));
    }
    return found;
  }
}

function listNumbered(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((n) => BLOCK_FILE.test(n)).sort();
}

// ─── contract parsing (shared by checks and --inventory) ──────────────────────

// Endpoint headings look like "## 3. POST /orders/{id}/cancel".
function contractEndpoints(file) {
  const md = MdFile.open(file);
  const list = [];
  for (const h of md.headings) {
    if (h.level < 2 || h.level > 3) continue;
    const parts = /^(\d+[a-z]?)\.[ \t]+([A-Z]+)[ \t]+(\/[^\s]*)/.exec(h.title);
    if (!parts) continue;
    list.push({ head: h, n: parts[1], method: parts[2], path: parts[3], title: h.title });
  }
  return list.map((ep, k) => {
    const stop = k + 1 < list.length ? list[k + 1].head.at : md.lines.length;
    const body = md.lines.slice(ep.head.at + 1, stop).join('\n');
    const nearby = [ep.title, ...md.lines.slice(ep.head.at + 1, Math.min(stop, ep.head.at + 6))].join(' ');
    return { ...ep, body, proposed: /\[PROPOSED/i.test(nearby) };
  });
}

const isTableName = (t) => /^[a-z][_a-z\d]*$/.test(t);

function modelTables(file, maxLevel = 6) {
  return MdFile.open(file).headings
    .filter((h) => h.level <= maxLevel)
    .map((h) => h.title.replace(/`/g, '').trim())
    .filter(isTableName);
}

// ─── checks ───────────────────────────────────────────────────────────────────

const CHECKS = [];
const register = (name, run) => CHECKS.push({ name, run });

register('structure', (f, out) => {
  if (!f.readme) {
    out.error('no README.md — the feature lacks its overview, Block Index and Dependency Map', f.dir);
    return;
  }

  for (const ent of fs.readdirSync(f.dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (!ALLOWED_EXTRA_DIRS.includes(ent.name)) out.warn(`unexpected sub-folder "${ent.name}/" (feature folders hold blocks plus tasks/)`, f.dir);
    } else if (!ALLOWED_EXTRA_FILES.includes(ent.name) && !BLOCK_FILE.test(ent.name) && !ent.name.startsWith('_')) {
      out.warn(`stray file "${ent.name}": neither a numbered block nor a known helper file`, path.join(f.dir, ent.name));
    }
  }

  const table = f.readme.tableAfter(f.readme.findHeading((t) => /block index/i.test(t)));
  if (!table || !table.body.length) {
    out.error('README has no parsable Block Index table', f.readmePath);
    return;
  }
  const roleAt = columnIndex(table.columns, 'Role');
  if (roleAt < 0) out.warn('Block Index has no Role column; downstream skills will have to guess block roles from file names', f.readmePath);

  const listed = new Set();
  for (const row of table.body) {
    const flat = row.join(' ');
    if (!flat.replace(/[\s\-–—]/g, '')) continue;
    const href = row.map(linkTarget).find(Boolean);
    if (!href) {
      if (/n\/a|—|omitted|this file|not applicable/i.test(flat)) continue;
      out.warn(`Block Index row "${plainText(row[2] || row[1] || row[0] || '?')}" has no link and is not marked as omitted`, f.readmePath);
      continue;
    }
    const relPath = href.replace(/^\.\//, '');
    const base = path.basename(relPath);
    listed.add(base);
    if (roleAt >= 0 && row[roleAt]) {
      const role = plainText(row[roleAt]);
      if (role) f.roles.set(role, base);
    }
    if (!fs.existsSync(path.join(f.dir, relPath))) out.error(`Block Index links "${href}" but that file does not exist`, f.readmePath);
  }

  for (const b of f.blocks) {
    const p = path.join(f.dir, b);
    if (!listed.has(b)) out.error(`block "${b}" exists but the Block Index does not list it`, p);
    if (!MdFile.open(p).raw.includes('](./README.md)')) out.warn(`block "${b}" lacks the footer link back to ./README.md`, p);
  }
});

register('structure', (f, out) => {
  if (!f.readme) return;
  const titles = f.readme.headings.filter((h) => h.level <= 3)
    .map((h) => h.title.replace(/^\d+\.?\s*/, '').toLowerCase());
  for (const sec of OVERVIEW_SECTIONS) {
    if (!titles.some((t) => sec.words.some((w) => t.startsWith(w)))) {
      out.error(`README section "${sec.label}" is missing${sec.label === 'Dependency Map' ? ' (create-tasks derives waves from it)' : ''}`, f.readmePath);
    }
  }

  const dep = f.readme.findHeading((t) => /^\d*\.?\s*dependency map/i.test(t));
  if (dep) {
    const text = f.readme.sectionBody(dep)
      .filter((ln) => !ln.trimStart().startsWith('>') && !ln.trimStart().startsWith('#'))
      .join('\n').trim();
    if (text.length < 20) out.error('README "Dependency Map" is empty; task ordering cannot be derived from it', f.readmePath);
  }

  const firstH2 = f.readme.headings.find((h) => h.level === 2 || h.level === 3);
  const intro = f.readme.raw.split('\n').slice(0, firstH2 ? firstH2.at : undefined).join('\n');
  if (!/\]\(\S+\)|https?:\/\/|\.md\b|\.txt\b/.test(intro)) {
    out.warn('README intro cites no requirement source (link or file), so the origin of this design is untraceable', f.readmePath);
  }
});

register('structure', (f, out) => {
  const log = f.blockFor('change-log', /change-log/);
  if (!log) return;
  const p = path.join(f.dir, log);
  const md = MdFile.open(p);
  const anyTable = md.lines.some((ln) => ln.trim().startsWith('|'))
    ? md.tableAfter({ at: md.lines.findIndex((ln) => ln.trim().startsWith('|')) - 1, level: 1 })
    : null;
  if (!anyTable || !anyTable.body.length) out.warn(`change log "${log}" has no entries yet; add the initial row`, p);
});

register('placeholders', (f, out) => {
  for (const file of f.markdownFiles()) {
    const prose = MdFile.open(file).prose;
    const left = UNFILLED_SLOTS.filter((slot) => prose.includes(slot));
    if (!left.length) continue;
    const shown = left.slice(0, 6).join(', ') + (left.length > 6 ? ` …and ${left.length - 6} others` : '');
    out.error(`${f.rel(file)} still contains unfilled template slots: ${shown}`, file);
  }
});

register('size', (f, out) => {
  for (const b of f.blocks) {
    const p = path.join(f.dir, b);
    const n = MdFile.open(p).nonEmptyLength;
    if (n > LIMITS.blockLines) out.warn(`block "${b}" is ${n} lines (max ${LIMITS.blockLines}); split it and index both halves`, p);
  }
  for (const t of f.taskFiles) {
    const p = path.join(f.tasksDir, t);
    const n = MdFile.open(p).nonEmptyLength;
    if (n > LIMITS.taskLines) out.warn(`task "${t}" is ${n} lines (max ${LIMITS.taskLines}); its scope is probably too wide, split by concern`, p);
  }
});

register('links', (f, out) => {
  for (const file of f.markdownFiles()) {
    for (const link of MdFile.open(file).relativeLinks) {
      const dest = path.resolve(path.dirname(file), link.target);
      if (!fs.existsSync(dest)) {
        out.error(`${f.rel(file)}: link "${link.href}" points at a missing file`, file);
        continue;
      }
      if (!link.fragment || !dest.endsWith('.md') || !fs.statSync(dest).isFile()) continue;
      if (!MdFile.open(dest).anchors.has(link.fragment.toLowerCase())) {
        out.error(`${f.rel(file)}: anchor "#${link.fragment}" has no matching heading in ${f.rel(dest)}`, file);
      }
    }
  }
});

register('shared', (f, out) => {
  const contractPath = f.shared('api-contract');
  const modelPath = f.shared('data-model');
  const hasContract = fs.existsSync(contractPath);
  const hasModel = fs.existsSync(modelPath);

  const apiBlock = f.blockFor('api-endpoints', /api-endpoints/);
  let apiText = null;
  if (apiBlock) {
    const p = path.join(f.dir, apiBlock);
    apiText = MdFile.open(p).raw;
    const none = /no (http )?endpoints/i.test(apiText);
    if (!none && !hasContract) out.error(`"${apiBlock}" lists endpoints but ${f.rel(contractPath)} does not exist`, p);
    if (!none && hasContract && !apiText.includes('api-contract/')) out.warn(`"${apiBlock}" never links into api-contract/; it should reference the specs, not restate them`, p);
    if (!none && /^\s*```json/m.test(apiText)) out.warn(`"${apiBlock}" embeds JSON payloads; those belong in api-contract/${f.slug}.md`, p);
  }

  const dbBlock = f.blockFor('db-schema', /database-schema|^01[a-z]?-/);
  if (dbBlock) {
    const p = path.join(f.dir, dbBlock);
    const text = MdFile.open(p).raw;
    const none = /no (new )?(entities|tables)/i.test(text);
    if (!none && text.includes('|') && !hasModel && !text.includes('data-model/')) {
      out.warn(`"${dbBlock}" defines entities but there is no ${f.rel(modelPath)} and no link to another data-model file`, p);
    }
  }

  if (hasContract) {
    const eps = contractEndpoints(contractPath);
    const byNumber = new Map();
    const where = `api-contract/${f.slug}.md`;
    for (const ep of eps) {
      if (byNumber.has(ep.n)) {
        out.error(`${where}: section number ${ep.n} appears twice ("${byNumber.get(ep.n).title}", "${ep.title}"); duplicate anchors misroute links`, contractPath);
        continue;
      }
      byNumber.set(ep.n, ep);
      if (/\[PROPOSED/i.test(ep.title + ep.body)) continue;
      // Loose on purpose: contracts are worded many ways, so these stay warnings.
      if (!/\bauth|\brole/i.test(ep.body)) out.warn(`${where} "${ep.title}": no auth/role information`, contractPath);
      if (!/\b(response|returns|responds|200|201|204)\b/i.test(ep.body)) out.warn(`${where} "${ep.title}": no response or status described`, contractPath);
      if (['POST', 'PUT', 'PATCH'].includes(ep.method) && !/\b(request|body|payload|dto)\b/i.test(ep.body)) {
        out.warn(`${where} "${ep.title}": mutating endpoint without a request body description`, contractPath);
      }
    }
    if (apiText !== null) {
      for (const ep of byNumber.values()) {
        const anchor = githubSlug(ep.title);
        const route = ep.title.replace(/^\d+[a-z]?\.\s*/, '').trim();
        if (!apiText.includes(`#${anchor}`) && !apiText.includes(route)) {
          out.error(`endpoint ${ep.n} (\`${route}\`) from ${where} is neither linked (#${anchor}) nor mentioned in "${apiBlock}"`, path.join(f.dir, apiBlock));
        }
      }
    }
    const pending = eps.filter((e) => e.proposed);
    if (pending.length) {
      f._drift = `${pending.length} still-unshipped endpoint(s) tagged [PROPOSED — not in code] → ${pending.map((e) => `${e.method} ${e.path}`).join(', ')}. Drop the marker once shipped or remove the endpoint (/architect:audit-architecture).`;
    }
  }

  if (hasModel && dbBlock) {
    const p = path.join(f.dir, dbBlock);
    const idx = MdFile.open(p).prose;
    for (const t of new Set(modelTables(modelPath))) {
      if (!idx.includes(t)) out.warn(`table \`${t}\` from data-model/${f.slug}.md is absent from the entity index "${dbBlock}"`, p);
    }
  }

  for (const kind of SHARED_KINDS) {
    const own = f.shared(kind);
    const overview = path.join(f.root, kind, 'README.md');
    if (!fs.existsSync(own) || !fs.existsSync(overview)) continue;
    const ov = MdFile.open(overview).raw;
    if (!ov.includes(`${f.slug}.md`) && !ov.includes(`${f.slug})`)) out.error(`${kind}/README.md does not list ${kind}/${f.slug}.md`, overview);
  }
});

register('drift', (f, out) => {
  if (f._drift) out.warn(f._drift, f.shared('api-contract'));
});

register('tasks', (f, out) => {
  if (!fs.existsSync(f.tasksDir)) return;
  const indexPath = path.join(f.tasksDir, 'README.md');
  if (!fs.existsSync(indexPath)) { out.error('tasks/ exists without a README.md (task index, waves, dependencies)', f.tasksDir); return; }
  if (!f.taskFiles.length) { out.warn('the tasks index has no NN-*.md task specs beside it', f.tasksDir); return; }

  const lowest = f.taskFiles[0];
  if (!lowest.startsWith('01-') && !/^01[a-z]-/.test(lowest)) {
    out.error(`first task file is "${lowest}"; a task 01 (contracts + validations foundation) is mandatory`, f.tasksDir);
  } else if (!/contract/i.test(lowest)) {
    out.warn(`task 01 "${lowest}" does not look like the contracts + validations foundation`, path.join(f.tasksDir, lowest));
  }

  const index = MdFile.open(indexPath);
  const table = index.tableAfter(index.findHeading((t) => /^tasks$/i.test(t.trim())))
    || index.tableAfter(index.findHeading((t) => /tasks/i.test(t)));
  const cols = table ? table.columns : [];
  const at = {
    id: Math.max(columnIndex(cols, '#', 'No', 'File', 'Task#'), 0),
    wave: columnIndex(cols, 'Wave'),
    deps: columnIndex(cols, 'Depends on', 'Deps', 'Depends'),
    scope: columnIndex(cols, 'Scope'),
  };

  const tasks = new Map();
  const idsSeen = [];
  for (const row of table ? table.body : []) {
    const id = leadingNumber(row[at.id] || '');
    if (!id) continue;
    idsSeen.push(id);
    const scopeRaw = at.scope >= 0 ? plainText(row[at.scope]) : '';
    const scopeMatch = /^(\w+)(\s*\([^)]*\))?$/.exec(scopeRaw);
    tasks.set(id, {
      wave: at.wave >= 0 ? Number.parseInt(plainText(row[at.wave]), 10) : NaN,
      deps: at.deps >= 0 ? plainText(row[at.deps]).split(/[\s,]+/).filter((d) => /^\d+[a-z]?$/.test(d)) : [],
      scopeRaw,
      scopeBase: scopeMatch && SCOPE_TOKENS.includes(scopeMatch[1]) ? scopeMatch[1] : null,
    });
  }
  if (!tasks.size) {
    out.error('tasks/README.md has no readable task table (expected columns like # | Task | Wave | Depends on | Scope)', indexPath);
    return;
  }

  // Files <-> rows, both directions, and duplicate numbers on either side.
  const fileIds = f.taskFiles.map((n) => BLOCK_FILE.exec(n)[1]);
  f.taskFiles.forEach((n, k) => {
    if (!tasks.has(fileIds[k])) out.error(`task file "${n}" has no row in the tasks index`, path.join(f.tasksDir, n));
  });
  for (const id of tasks.keys()) {
    if (!fileIds.includes(id)) out.error(`tasks index lists task ${id} but no "${id}-*.md" file exists`, indexPath);
  }
  const tally = (arr) => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
  for (const [id, c] of tally(idsSeen)) if (c > 1) out.error(`task number ${id} is used by ${c} rows of the tasks index; one of them is hidden from every other check`, indexPath);
  for (const [id, c] of tally(fileIds)) {
    if (c > 1) out.error(`task number ${id} is shared by ${c} files (${f.taskFiles.filter((n) => n.startsWith(`${id}-`)).join(', ')})`, f.tasksDir);
  }

  // Dependency graph: self-references, unknown ids, cycles.
  for (const [id, t] of tasks) {
    if (t.deps.includes(id)) out.error(`task ${id} depends on itself`, indexPath);
    for (const d of t.deps) if (!tasks.has(d)) out.error(`task ${id} depends on unknown task ${d}`, indexPath);
  }
  const done = new Set();
  const trail = [];
  const walk = (id) => {
    if (done.has(id)) return;
    if (trail.includes(id)) {
      out.error(`circular dependency: ${[...trail.slice(trail.indexOf(id)), id].join(' -> ')}`, indexPath);
      return;
    }
    trail.push(id);
    for (const d of tasks.get(id).deps) if (d !== id && tasks.has(d)) walk(d);
    trail.pop();
    done.add(id);
  };
  [...tasks.keys()].forEach(walk);

  // Waves: every task has one, numbering is 1..N without holes, deps land strictly earlier.
  const waveOf = (id) => tasks.get(id).wave;
  for (const [id, t] of tasks) if (!Number.isFinite(t.wave)) out.error(`task ${id} has no wave; implementation is scheduled by wave only`, indexPath);
  const waveList = [...new Set([...tasks.values()].map((t) => t.wave).filter(Number.isFinite))].sort((x, y) => x - y);
  if (waveList.length && waveList[0] !== 1) out.error(`waves start at ${waveList[0]} instead of 1`, indexPath);
  for (let k = 1; k < waveList.length; k++) {
    if (waveList[k] - waveList[k - 1] !== 1) out.error(`wave numbering jumps ${waveList[k - 1]} -> ${waveList[k]}; waves run strictly in sequence`, indexPath);
  }
  for (const [id, t] of tasks) {
    for (const d of t.deps) {
      if (tasks.has(d) && Number.isFinite(t.wave) && Number.isFinite(waveOf(d)) && waveOf(d) >= t.wave) {
        out.error(`task ${id} (wave ${t.wave}) needs task ${d}, which is in wave ${waveOf(d)}; prerequisites must be in an earlier wave`, indexPath);
      }
    }
    if (id !== '01' && !t.deps.length) out.warn(`task ${id} declares no dependencies; at minimum it builds on task 01`, indexPath);
  }
  const firstWave = [...tasks].filter(([, t]) => t.wave === 1).map(([id]) => id);
  if (firstWave.length > 1) out.error(`wave 1 contains ${firstWave.join(', ')}; only task 01 may be in wave 1`, indexPath);

  // Scope tokens.
  for (const [id, t] of tasks) {
    if (t.scopeRaw && !t.scopeBase) {
      out.error(`task ${id} has Scope "${t.scopeRaw}"; allowed: ${SCOPE_TOKENS.join(' or ')}, optionally with a "(qualifier)" like "BE (worker)"`, indexPath);
    } else if (t.scopeBase === 'contracts' && id !== '01') {
      out.warn(`task ${id} is scoped "contracts", which is reserved for task 01`, indexPath);
    }
  }
  const t01 = tasks.get('01');
  if (t01 && t01.scopeBase && t01.scopeBase !== 'contracts') out.warn(`task 01 is scoped "${t01.scopeRaw}" instead of "contracts"`, indexPath);

  // Wave sizing: too big to review, or a long streak of single-task waves (no parallelism).
  const sizes = new Map();
  for (const t of tasks.values()) if (Number.isFinite(t.wave)) sizes.set(t.wave, (sizes.get(t.wave) || 0) + 1);
  for (const w of [...sizes.keys()].sort((x, y) => x - y)) {
    if (sizes.get(w) > LIMITS.tasksPerWave) out.warn(`wave ${w} has ${sizes.get(w)} tasks (max ${LIMITS.tasksPerWave}); split it into consecutive waves so each stays reviewable`, indexPath);
  }
  let streak = { from: 0, len: 0 };
  let best = { from: 0, len: 0 };
  for (const w of waveList) {
    if (w > 1 && sizes.get(w) === 1) {
      streak = streak.len && streak.from + streak.len === w ? { from: streak.from, len: streak.len + 1 } : { from: w, len: 1 };
      if (streak.len > best.len) best = { ...streak };
    } else streak = { from: 0, len: 0 };
  }
  if (best.len >= LIMITS.singleTaskWaveStreak) {
    out.warn(`waves ${best.from}-${best.from + best.len - 1} hold one task each, so nothing runs in parallel; re-cut tasks along file boundaries or merge them and note why the work is serial`, indexPath);
  }

  // Task spec content.
  for (const n of f.taskFiles) {
    const p = path.join(f.tasksDir, n);
    const md = MdFile.open(p);
    if (!md.findHeading((t) => /^architecture references/i.test(t))) out.warn(`task "${n}" has no "Architecture references" section to build from`, p);
    if (/^\s*```json/m.test(md.raw)) out.warn(`task "${n}" embeds JSON; reference the API contract instead`, p);
  }
});

// ─── inventory ────────────────────────────────────────────────────────────────

function inventory(root, slug) {
  const f = new Feature(root, slug);
  const contractPath = f.shared('api-contract');
  const modelPath = f.shared('data-model');
  return {
    feature: slug,
    endpoints: fs.existsSync(contractPath)
      ? contractEndpoints(contractPath).map((e) => ({
        n: e.n, method: e.method, path: e.path, proposed: e.proposed,
        anchor: githubSlug(e.title), file: f.rel(contractPath),
      }))
      : [],
    entities: fs.existsSync(modelPath)
      ? modelTables(modelPath, 2).map((table) => ({ table, anchor: githubSlug(table), file: f.rel(modelPath) }))
      : [],
    tasks: f.taskFiles.map((n) => {
      const text = MdFile.open(path.join(f.tasksDir, n)).raw;
      return {
        file: `tasks/${n}`, n: BLOCK_FILE.exec(n)[1],
        implemented: /\bIMPLEMENTED\b/.test(text), superseded: /\bSUPERSEDED\b/.test(text),
      };
    }),
  };
}

// ─── driver ───────────────────────────────────────────────────────────────────

function locateDocs(explicit) {
  if (explicit) return explicit;
  for (const cfgPath of [path.join('.claude', 'toolkit.json'), path.join('.claude', 'project.config.json')]) {
    let cfg;
    try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch { continue; }
    const fromCfg = (cfg.paths && cfg.paths.architectureDocs) || cfg.architectureDocs || cfg.docsRoot;
    if (fromCfg) return fromCfg;
  }
  return ['docs/architecture2', 'docs/architecture'].find((d) => fs.existsSync(d)) || 'docs/architecture';
}

function listFeatures(root, only) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !SHARED_KINDS.includes(e.name) && !/^[._]/.test(e.name))
    .map((e) => e.name)
    .filter((n) => !only || n === only)
    .sort();
}

function orphanSharedFiles(root, only, ledger) {
  for (const kind of SHARED_KINDS) {
    const d = path.join(root, kind);
    if (!fs.existsSync(d)) continue;
    for (const n of fs.readdirSync(d)) {
      if (!n.endsWith('.md') || n === 'README.md' || n === 'foundation.md') continue;
      const slug = n.slice(0, -3);
      if (only && only !== slug) continue;
      if (!fs.existsSync(path.join(root, slug))) {
        ledger.push('warning', slug, 'shared', `${kind}/${n} belongs to no feature folder`, path.join(d, n));
      }
    }
  }
}

function printText(root, features, ledger) {
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  console.log(`\nValidating ${root} — ${plural(features.length, 'feature')}\n`);
  const grouped = new Map();
  for (const it of ledger.items) {
    if (!grouped.has(it.feature)) grouped.set(it.feature, []);
    grouped.get(it.feature).push(it);
  }
  for (const name of [...grouped.keys()].sort()) {
    const list = grouped.get(name).slice().sort((x, y) => (x.level === y.level ? 0 : x.level === 'error' ? -1 : 1));
    const errs = list.filter((x) => x.level === 'error').length;
    console.log(`${errs ? 'FAIL' : 'WARN'}  ${name}: ${plural(errs, 'error')}, ${plural(list.length - errs, 'warning')}`);
    for (const it of list) console.log(`  ${it.level === 'error' ? 'E' : 'W'} ${it.check.padEnd(12)} ${it.message}`);
    console.log('');
  }
  const ok = features.filter((n) => !grouped.has(n));
  if (ok.length) console.log(`OK    ${ok.join(', ')}\n`);
  console.log(`Total: ${plural(ledger.count('error'), 'error')}, ${plural(ledger.count('warning'), 'warning')}`);
}

function main() {
  const opts = readOptions(process.argv.slice(2));
  if (opts.help) { console.log(HELP); return 0; }

  const root = locateDocs(opts.dir);
  if (!fs.existsSync(root)) {
    console.error(`validate-architecture: docs folder "${root}" not found; pass it explicitly as the first argument.`);
    return 2;
  }
  const features = listFeatures(root, opts.feature);
  if (!features.length) {
    console.error(`validate-architecture: no feature folders in "${root}"${opts.feature ? ` matching "${opts.feature}"` : ''}.`);
    return 2;
  }

  if (opts.inventory) {
    const declared = features.map((s) => inventory(root, s));
    process.stdout.write(`${JSON.stringify({ docsRoot: root, features: declared }, null, 2)}\n`);
    return 0;
  }

  const ledger = new Ledger();
  for (const slug of features) {
    const feature = new Feature(root, slug);
    for (const check of CHECKS) check.run(feature, ledger.scoped(slug, check.name));
  }
  orphanSharedFiles(root, opts.feature, ledger);

  const errors = ledger.count('error');
  const warnings = ledger.count('warning');
  if (opts.json) {
    const report = { docsRoot: root, features, errors, warnings, findings: ledger.items };
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    printText(root, features, ledger);
  }
  return errors > 0 || (opts.failOnWarn && warnings > 0) ? 1 : 0;
}

process.exitCode = main();
