/**
 * architect · multi-epic pipeline (Workflow tool script)
 *
 * Started by /architect:multi-epic-workflow:
 *   Workflow({ scriptPath: "${CLAUDE_PLUGIN_ROOT}/workflows/multi-epic.mjs", args })
 *
 * Takes 2+ independent backend features ("epics" = local folders under {docs-root}) and drives each one
 * end to end without a human in the loop:
 *
 *   Survey     read-only scan per epic: is it buildable, is it backend-only, which waves, which paths
 *   Repair     epics that are not buildable get their missing docs written (architecture / tasks)
 *   Build      per epic, one isolated-worktree agent per wave; waves in order, epics concurrently
 *   Challenge  per epic, a sceptical reviewer emits a bridge handoff, validates it, returns a verdict
 *   Landing    overlap map between epics + an order in which to land them
 *
 * Epics that need frontend or infra/ops work are classified `manual` during Survey and skipped by every
 * later stage; they are returned so a person can pick them up.
 *
 * Branch names follow rules/shared/git-workflow.md: `<type>/<short-kebab-summary>` describing what the
 * code does — no task numbers, ticket keys or wave numbers. Each wave gets a branch named after what it
 * delivers; names are computed here, deterministically, and de-duplicated with a numeric suffix.
 *
 * args (built by the command):
 *   ["order-delivery", "billing"]
 *   { epics: [...], baseBranch?: "main" }        (`features` is accepted in place of `epics`)
 * Each entry is a feature slug or the path of a feature folder.
 *
 * This is a Workflow body: top-level await/return are allowed, and there is no fs, Date.now or
 * Math.random — agents do all reading and writing with their own tools.
 */

export const meta = {
  name: 'multi-epic',
  description:
    'Drive several independent backend features (feature slugs or folder paths) end to end: survey readiness, repair missing docs, build wave by wave in isolated worktrees, challenge each result through the agent-loop-bridge handoff, then map overlaps and propose a landing order.',
  phases: [
    { title: 'Survey', detail: 'read-only, one agent per epic: buildable or not, backend or manual, waves with what each delivers, paths likely to change' },
    { title: 'Repair', detail: 'epics that are not buildable get their architecture / task docs completed — docs only, no product code' },
    { title: 'Build', detail: 'one worktree-isolated agent per wave; waves sequential inside an epic, epics concurrent' },
    { title: 'Challenge', detail: 'a sceptical reviewer per epic: handoff.v1 event, bridge validator when present, verdict ship / hold / escalate' },
    { title: 'Landing', detail: 'paths touched by more than one epic, and the order to land epics from narrowest to widest footprint' },
  ],
};

// ---------------------------------------------------------------- inputs

const rawList = Array.isArray(args) ? args : args?.epics ?? args?.features ?? [];
const pickName = (item) => (item && typeof item === 'object' ? item.slug ?? item.path ?? item.name ?? item.id : item);
const epicIds = [...new Set(
  (Array.isArray(rawList) ? rawList : [])
    .map((item) => String(pickName(item) ?? '').trim().replace(/\/+$/, ''))
    .filter((s) => s.length > 0),
)];
if (!epicIds.length) {
  throw new Error('multi-epic: nothing to run. Pass feature slugs or folder paths, e.g. ["order-delivery", "billing"] or { epics: [...] }.');
}
const trunk = (!Array.isArray(args) && args?.baseBranch) || 'main';

// ---------------------------------------------------------------- branch naming

const BRANCH_TYPES = ['feat', 'fix', 'refactor', 'perf', 'test', 'docs', 'chore', 'ci'];
const FILLER = new Set(['a', 'an', 'the', 'and', 'of', 'for', 'to', 'with', 'task', 'tasks', 'ticket', 'wave', 'implement', 'implementation', 'add', 'epic']);

const kebab = (text) => String(text)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .split(' ')
  .filter((w) => w && !FILLER.has(w) && !/^\d+$/.test(w))
  .slice(0, 5)
  .join('-');

const leafOf = (id) => id.split('/').filter(Boolean).pop();
const claimed = new Set();
const claimBranch = (type, summary, fallback) => {
  const t = BRANCH_TYPES.includes(type) ? type : 'feat';
  const stem = `${t}/${kebab(summary) || kebab(fallback) || 'change'}`;
  let candidate = stem;
  for (let n = 2; claimed.has(candidate); n += 1) candidate = `${stem}-${n}`;
  claimed.add(candidate);
  return candidate;
};

// ---------------------------------------------------------------- schemas

const SURVEY_SHAPE = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'buildable', 'track', 'gaps', 'plan', 'footprint'],
  properties: {
    id: { type: 'string' },
    buildable: { type: 'boolean', description: 'true only if architecture, wave-ordered tasks and inputs are all present and consistent' },
    track: { type: 'string', enum: ['backend', 'manual', 'unclear'], description: 'manual = any frontend or infra/ops work is involved' },
    gaps: { type: 'array', items: { type: 'string' } },
    plan: {
      type: 'array',
      description: 'waves in dependency order; the first one is the contracts wave',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['order', 'delivers', 'kind', 'items'],
        properties: {
          order: { type: 'integer', minimum: 1 },
          delivers: { type: 'string', description: '2-5 words naming the capability this wave adds, e.g. "courier eta endpoint"; no numbers or ticket keys' },
          kind: { type: 'string', enum: BRANCH_TYPES },
          items: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    footprint: { type: 'array', items: { type: 'string' }, description: 'files/dirs this epic will probably change' },
  },
};

const BUILD_SHAPE = {
  type: 'object',
  additionalProperties: false,
  required: ['branch', 'commit', 'summary', 'files', 'tests'],
  properties: {
    branch: { type: 'string', description: 'the branch actually created (differs from the requested one only if that name was taken)' },
    commit: { type: 'string' },
    summary: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    tests: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['command', 'outcome'],
        properties: { command: { type: 'string' }, outcome: { type: 'string', enum: ['passed', 'failed', 'not-run'] } },
      },
    },
  },
};

const CHALLENGE_SHAPE = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'decision', 'reasoning', 'mustFix', 'bridgeChecked'],
  properties: {
    id: { type: 'string' },
    decision: { type: 'string', enum: ['ship', 'hold', 'escalate'], description: 'ship = mergeable; hold = blocking defects; escalate = a human must decide' },
    reasoning: { type: 'string' },
    mustFix: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['issue', 'evidence'],
        properties: { issue: { type: 'string' }, evidence: { type: 'string' } },
      },
    },
    bridgeChecked: { type: 'string', enum: ['accepted', 'rejected', 'validator-absent'] },
  },
};

const LANDING_SHAPE = {
  type: 'object',
  additionalProperties: false,
  required: ['overlaps', 'twins', 'sequence', 'notes'],
  properties: {
    overlaps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'touchedBy'],
        properties: { path: { type: 'string' }, touchedBy: { type: 'array', items: { type: 'string' } } },
      },
    },
    twins: { type: 'array', items: { type: 'string' }, description: 'new files on different epic branches that do the same job and must be merged into one owner' },
    sequence: { type: 'array', items: { type: 'string' }, description: 'epic ids, first to land first' },
    notes: { type: 'string' },
  },
};

// ---------------------------------------------------------------- Survey

phase('Survey');
const surveys = (await parallel(epicIds.map((id) => () => agent(
  [
    `Read-only survey of the feature "${id}" (repository base branch: ${trunk}). Do not modify anything.`,
    `Locate it: either {docs-root}/${id}/ or the folder path itself; docs-root comes from .claude/toolkit.json or CLAUDE.md.`,
    'Inspect the architecture blocks (api-contract/ and data-model/ are the single source of truth), the tasks/ folder with its waves, and any linked docs.',
    'Fill in:',
    '  buildable — could an implementer start right now without inventing anything?',
    '  track — backend if every piece is backend work; manual if any frontend or infra/ops work is involved; unclear otherwise.',
    '  gaps — each missing or inconsistent prerequisite, one per entry.',
    '  plan — the waves in dependency order (contracts first). For each wave: what it delivers in 2-5 plain words, the',
    '         change kind (feat, fix, refactor, perf, test, docs, chore, ci), and its items. Never put numbers or ticket keys in "delivers".',
    '  footprint — files and directories the feature will most likely touch.',
  ].join('\n'),
  { label: `survey · ${id}`, phase: 'Survey', schema: SURVEY_SHAPE, agentType: 'Explore' },
)))).filter(Boolean);

const manual = surveys.filter((s) => s.track === 'manual');
const queue = surveys.filter((s) => s.track !== 'manual');
const needsRepair = queue.filter((s) => !s.buildable);
log(`Survey: ${surveys.length}/${epicIds.length} answered · ${queue.length - needsRepair.length} buildable · ${needsRepair.length} need docs · ${manual.length} manual.`);

// ---------------------------------------------------------------- Repair

phase('Repair');
const repairNotes = new Map();
if (needsRepair.length === 0) {
  log('Repair: nothing to do.');
} else {
  const repaired = await parallel(needsRepair.map((s) => () => agent(
    [
      `Feature "${s.id}" is not buildable yet. Gaps reported by the survey:`,
      ...s.gaps.map((g) => `  • ${g}`),
      '',
      'Close every gap by writing or correcting documentation only — never product code:',
      '  - architecture: block layout backed by the shared api-contract/ and data-model/ files (create-architecture method);',
      '  - tasks: slices grouped into dependency waves, contracts wave first (create-tasks method).',
      'Finish by restating the waves: for each, what it delivers in 2-5 plain words and its items.',
    ].join('\n'),
    { label: `repair · ${s.id}`, phase: 'Repair' },
  )));
  needsRepair.forEach((s, i) => repairNotes.set(s.id, repaired[i] ?? null));
  log(`Repair: ${repaired.filter(Boolean).length}/${needsRepair.length} epics got their docs completed.`);
}

// ---------------------------------------------------------------- Build

const footprintTable = queue.map((s) => `  ${s.id}: ${s.footprint.join(', ') || '(none predicted)'}`).join('\n');
const sharedPaths = (() => {
  const seen = new Map();
  for (const s of queue) for (const p of s.footprint) seen.set(p, [...(seen.get(p) ?? []), s.id]);
  return [...seen.entries()].filter(([, owners]) => owners.length > 1);
})();
const hotspotText = sharedPaths.length
  ? sharedPaths.map(([p, owners]) => `  ${p} — owner ${owners[0]}, others append only: ${owners.slice(1).join(', ')}`).join('\n')
  : '  (no predicted overlap)';

// Plan every branch name before any agent starts, so names are stable and unique across epics.
const buildPlans = queue.map((s) => {
  const waves = (s.plan?.length ? s.plan : [{ order: 1, delivers: leafOf(s.id), kind: 'feat', items: ['the whole feature'] }])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((w, idx) => ({
      ...w,
      branch: claimBranch(w.kind, idx === 0 && /contract/i.test(w.delivers) ? `${leafOf(s.id)} contracts` : w.delivers, `${leafOf(s.id)} ${w.delivers}`),
    }));
  return { id: s.id, waves };
});
const siblingBranches = buildPlans.flatMap((p) => p.waves.map((w) => w.branch));

phase('Build');
const builds = (await parallel(buildPlans.map((plan) => async () => {
  const done = [];
  let forkPoint = trunk;
  for (const w of plan.waves) {
    const report = await agent(
      [
        `Inside this isolated worktree, build one wave of feature "${plan.id}": ${w.delivers}.`,
        'Items:',
        ...w.items.map((t) => `  • ${t}`),
        '',
        `Branch: create ${w.branch} from ${forkPoint}. If that name already exists in the repo, append -2, -3, … until it is free and report the name you used.`,
        `Commit subject: "${w.kind}: <what the change does>" — never include task numbers, ticket keys or the word "task".`,
        'Spec: the feature architecture and task docs; api-contract/ and data-model/ are authoritative, do not invent contracts.',
        'Rules: follow .claude/rules/. Build and test everything you touched and fix failures before you finish.',
        '',
        'Cross-epic etiquette (all worktrees share one object store, so sibling branches are readable locally):',
        `  - sibling branches: ${siblingBranches.filter((b) => !plan.waves.some((x) => x.branch === b)).join(', ') || 'none'}`,
        '  - before creating any reusable piece (util, module, contract type, endpoint, migration) run git grep over those',
        '    branches; if it exists, consume it or leave a TODO naming it — never build a second copy;',
        '  - on paths owned by another epic, only append; structural edits there are requests to the owner.',
        'Predicted footprints:',
        footprintTable,
        'Shared paths and owners:',
        hotspotText,
        '',
        'Report the branch you created, the commit sha, a one-paragraph summary, the files touched, and each test command with its outcome.',
      ].join('\n'),
      { label: `build · ${plan.id} · ${w.delivers}`, phase: 'Build', schema: BUILD_SHAPE, isolation: 'worktree' },
    );
    const branch = report?.branch || w.branch;
    done.push({ delivers: w.delivers, branch, report });
    if (!report) break; // a later wave would fork from a branch that does not exist
    forkPoint = branch;
  }
  return { id: plan.id, waves: done, finalBranch: forkPoint };
}))).filter(Boolean);

log(`Build: ${builds.length} epics, ${builds.reduce((n, b) => n + b.waves.filter((w) => w.report).length, 0)} waves committed.`);

// ---------------------------------------------------------------- Challenge

phase('Challenge');
const verdicts = (await parallel(builds.map((b) => () => agent(
  [
    `Review feature "${b.id}" as a sceptic. You may read and run checks; you may not edit, merge or push.`,
    `Top branch: ${b.finalBranch}. Wave reports:`,
    JSON.stringify(b.waves.map((w) => ({ delivers: w.delivers, branch: w.branch, report: w.report }))),
    '',
    '1. Write a handoff.v1 event for this change: producer lane, branch, head sha from git, behavior_changed, summary,',
    '   allowed_actions limited to review, forbidden_actions including merge / push_commits / patch_code, and required_checks.',
    '2. If tooling/agent-loop-bridge/validate.py exists, wrap the event as',
    '   {"kind":"handoff","live_head_sha":"<sha>","input":<event>} in a temp file and run it with --json.',
    '   Rejected → your decision cannot be "ship". Missing validator → say so and continue.',
    '3. Hunt for defects: diff vs architecture and tasks (contract drift, scope creep, missing wave, untested paths),',
    '   run the project checks for the touched areas, look for one-sided changes, silent behaviour changes, hardcoded config or secrets.',
    '4. Decide: ship, hold (blocking defects) or escalate (needs a human). Every mustFix entry carries evidence.',
  ].join('\n'),
  { label: `challenge · ${b.id}`, phase: 'Challenge', schema: CHALLENGE_SHAPE },
)))).filter(Boolean);

const tally = (d) => verdicts.filter((v) => v.decision === d).length;
log(`Challenge: ship ${tally('ship')} · hold ${tally('hold')} · escalate ${tally('escalate')}.`);

// ---------------------------------------------------------------- Landing

phase('Landing');
const landing = await agent(
  [
    `Plan how features ${queue.map((s) => s.id).join(', ')} should land on ${trunk}.`,
    `Predicted footprints:\n${footprintTable}`,
    `Built branches: ${JSON.stringify(builds.map((b) => ({ id: b.id, top: b.finalBranch, branches: b.waves.map((w) => w.branch) })))}`,
    `Review decisions: ${JSON.stringify(verdicts.map((v) => ({ id: v.id, decision: v.decision, mustFix: v.mustFix.length })))}`,
    '',
    'Produce:',
    '  overlaps — each path changed (or predicted) by two or more features; verify with git diff against the real branches.',
    '  twins — new files on different branches that serve the same purpose; each pair needs one owner before landing.',
    '  sequence — narrowest footprint first, widest last. Held or escalated features keep a slot but are flagged in notes.',
    `  notes — why this order, which overlaps drive it, and a reminder that each feature rebases on ${trunk} after every earlier landing.`,
  ].join('\n'),
  { label: 'landing plan', phase: 'Landing', schema: LANDING_SHAPE },
);

return {
  baseBranch: trunk,
  survey: surveys.map((s) => ({ id: s.id, buildable: s.buildable, track: s.track, gaps: s.gaps })),
  repaired: needsRepair.map((s) => ({ id: s.id, ok: Boolean(repairNotes.get(s.id)) })),
  manual: manual.map((s) => ({ id: s.id, why: 'involves frontend or infra/ops work — handle outside this pipeline' })),
  branches: builds.map((b) => ({ id: b.id, top: b.finalBranch, waves: b.waves.map((w) => ({ delivers: w.delivers, branch: w.branch, committed: Boolean(w.report) })) })),
  decisions: verdicts.map((v) => ({ id: v.id, decision: v.decision, bridge: v.bridgeChecked, mustFix: v.mustFix })),
  overlaps: landing?.overlaps ?? [],
  twins: landing?.twins ?? [],
  landingOrder: landing?.sequence ?? [],
  notes: landing?.notes ?? '',
};
