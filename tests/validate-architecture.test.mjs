// Tests for plugins/architect/scripts/validate-architecture.mjs.
// Each test builds a docs tree in a temp dir and runs the script with cwd set to that dir.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { cleanup, runScript, tempDir, writeTree } from './helpers/fs.mjs';

const SCRIPT = 'plugins/architect/scripts/validate-architecture.mjs';
const DOCS = 'docs/architecture';

/** A feature folder that satisfies every check (no errors, no warnings). */
function validFeature(slug) {
  return {
    [`docs/requirements/${slug}.md`]: `# ${slug} requirements\n`,
    [`${DOCS}/api-contract/README.md`]: `# API contract\n\n- [${slug}](./${slug}.md)\n`,
    [`${DOCS}/api-contract/${slug}.md`]: [
      `# ${slug} API`,
      '',
      '## 1. GET /orders',
      '',
      'Auth: any signed-in user (role `customer`).',
      '',
      'Response 200: the list of orders.',
      '',
      '## 2. POST /orders [PROPOSED — not in code]',
      '',
      'Request body: an order draft.',
      '',
    ].join('\n'),
    [`${DOCS}/data-model/README.md`]: `# Data model\n\n- [${slug}](./${slug}.md)\n`,
    [`${DOCS}/data-model/${slug}.md`]: `# ${slug} data model\n\n## orders\n\nOne row per order.\n`,
    [`${DOCS}/${slug}/README.md`]: [
      `# ${slug}`,
      '',
      `Source: [requirements](../../requirements/${slug}.md)`,
      '',
      '## 1. Overview',
      'Customers place and view orders.',
      '## 2. Scope',
      'Listing and creating orders.',
      '## 3. Assumptions & Decisions',
      'None beyond the requirements.',
      '## 4. Block Index',
      '| # | Role | Block | File | Summary |',
      '|---|------|-------|------|---------|',
      '| 01 | `db-schema` | Entities | [01-database-schema.md](./01-database-schema.md) | orders |',
      '| 02 | `api-endpoints` | Endpoints | [02-api-endpoints.md](./02-api-endpoints.md) | 2 endpoints |',
      '| 06 | `websocket` | Realtime | omitted — no live updates required | — |',
      '## 5. Dependency Map',
      'Endpoints (02) read and write the orders table defined in 01.',
      '',
    ].join('\n'),
    [`${DOCS}/${slug}/01-database-schema.md`]: [
      '# Entities',
      '',
      `| Entity | Table |`,
      `|---|---|`,
      `| Order | [orders](../data-model/${slug}.md#orders) |`,
      '',
      '[Back to overview](./README.md)',
      '',
    ].join('\n'),
    [`${DOCS}/${slug}/02-api-endpoints.md`]: [
      '# Endpoints',
      '',
      `- [GET /orders](../api-contract/${slug}.md#1-get-orders)`,
      `- [POST /orders](../api-contract/${slug}.md#2-post-orders-proposed--not-in-code)`,
      '',
      '[Back to overview](./README.md)',
      '',
    ].join('\n'),
    [`${DOCS}/${slug}/tasks/README.md`]: [
      `# ${slug} — Task Plan`,
      '',
      '## Tasks',
      '',
      '| # | Task | Wave | Depends on | Scope |',
      '|---|------|------|------------|-------|',
      '| 01 | contracts + validations | 1 | — | contracts |',
      '| 02 | Order listing | 2 | 01 | BE (api) |',
      '',
    ].join('\n'),
    [`${DOCS}/${slug}/tasks/01-contracts-and-validations.md`]:
      '# Task 01\n\n## Architecture references\n\n- [Block index](../README.md#4-block-index)\n',
    [`${DOCS}/${slug}/tasks/02-order-listing.md`]:
      '# Task 02 — IMPLEMENTED\n\n## Architecture references\n\n- [GET /orders](../../api-contract/orders.md#1-get-orders)\n',
  };
}

/** A feature folder with a known set of defects, one per check family. */
function brokenFeature(slug) {
  return {
    [`${DOCS}/${slug}/README.md`]: [
      `# {Feature Name}`,
      '',
      '## Overview',
      'Something.',
      '## Scope',
      'Something.',
      '## Assumptions',
      'None.',
      '## Block Index',
      '| # | Role | Block | File |',
      '|---|------|-------|------|',
      '| 01 | `db-schema` | Entities | [01-database-schema.md](./01-database-schema.md) |',
      '| 02 | `api-endpoints` | Endpoints | [02-api-endpoints.md](./02-api-endpoints.md) |',
      '',
      // no Dependency Map section
    ].join('\n'),
    // 02-api-endpoints.md is indexed but missing; 03 exists but is not indexed.
    [`${DOCS}/${slug}/01-database-schema.md`]: '# Entities\n\nSee [missing](./nowhere.md).\n\n[Back](./README.md)\n',
    [`${DOCS}/${slug}/03-extra.md`]: '# Extra\n\n[Back](./README.md)\n',
    [`${DOCS}/${slug}/tasks/README.md`]: [
      '## Tasks',
      '| # | Task | Wave | Depends on | Scope |',
      '|---|------|------|------------|-------|',
      '| 01 | contracts | 1 | — | contracts |',
      '| 02 | a | 2 | 03 | BE |',
      '| 03 | b | 2 | 02 | frontend |',
      '',
    ].join('\n'),
    [`${DOCS}/${slug}/tasks/01-contracts.md`]: '# 01\n\n## Architecture references\n',
    [`${DOCS}/${slug}/tasks/02-a.md`]: '# 02\n\n## Architecture references\n',
    [`${DOCS}/${slug}/tasks/03-b.md`]: '# 03\n\n## Architecture references\n',
  };
}

const parse = (stdout) => JSON.parse(stdout);

describe('validate-architecture', () => {
  let cwd;
  before(() => {
    cwd = tempDir('validate-arch-');
    writeTree(cwd, { ...validFeature('orders'), ...brokenFeature('broken') });
  });
  after(() => cleanup(cwd));

  test('--help prints usage and exits 0', () => {
    const r = runScript(SCRIPT, ['--help'], { cwd });
    assert.equal(r.code, 0);
    assert.match(r.stdout, /Exit status/);
  });

  test('valid feature passes with no findings, even with --warnings-as-errors', () => {
    const r = runScript(SCRIPT, [DOCS, '--feature', 'orders', '--json', '--warnings-as-errors'], { cwd });
    const report = parse(r.stdout);
    assert.deepEqual(report.findings.filter((f) => f.feature === 'orders' && f.check !== 'drift'), []);
    assert.equal(report.errors, 0);
    assert.deepEqual(report.features, ['orders']);
    assert.equal(report.docsRoot, DOCS);
  });

  test('valid feature exits 0 in text mode', () => {
    const r = runScript(SCRIPT, [DOCS, '--feature=orders'], { cwd });
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /Total: 0 errors/);
  });

  test('[PROPOSED] endpoints surface as a drift warning, which --warnings-as-errors turns into exit 1', () => {
    const plain = runScript(SCRIPT, [DOCS, '--feature', 'orders', '--json'], { cwd });
    assert.equal(plain.code, 0);
    const drift = parse(plain.stdout).findings.filter((f) => f.check === 'drift');
    assert.equal(drift.length, 1);
    assert.equal(drift[0].level, 'warning');
    assert.match(drift[0].message, /POST \/orders/);

    const strict = runScript(SCRIPT, [DOCS, '--feature', 'orders', '--warnings-as-errors'], { cwd });
    assert.equal(strict.code, 1);
  });

  test('broken feature exits 1 and reports the expected checks', () => {
    const r = runScript(SCRIPT, [DOCS, '--feature', 'broken', '--json'], { cwd });
    assert.equal(r.code, 1);
    // Regression: an indexed-but-missing role block (02-api-endpoints.md) used to crash with ENOENT.
    assert.equal(r.stderr, '');
    const report = parse(r.stdout);
    assert.ok(report.errors > 0);
    for (const f of report.findings) {
      assert.deepEqual(Object.keys(f).sort(), ['check', 'feature', 'file', 'level', 'message']);
      assert.ok(['error', 'warning'].includes(f.level));
    }
    const errorsOf = (check) => report.findings
      .filter((f) => f.level === 'error' && f.check === check)
      .map((f) => f.message);
    const has = (check, rx) => assert.ok(errorsOf(check).some((m) => rx.test(m)), `${check}: ${rx} not in ${JSON.stringify(errorsOf(check))}`);

    has('structure', /Dependency Map" is missing/);
    has('structure', /links "\.\/02-api-endpoints\.md" but that file does not exist/);
    has('structure', /block "03-extra\.md" exists but the Block Index does not list it/);
    has('placeholders', /\{Feature Name\}/);
    has('links', /nowhere\.md/);
    has('tasks', /circular dependency/);
    has('tasks', /wave 1 contains|task 02 \(wave 2\) needs task 03/);
    has('tasks', /Scope "frontend"/);
  });

  test('running over the whole root lists both features and fails', () => {
    const r = runScript(SCRIPT, [DOCS, '--json'], { cwd });
    assert.equal(r.code, 1);
    assert.deepEqual(parse(r.stdout).features, ['broken', 'orders']);
  });

  test('docs root is found from .claude/toolkit.json when not passed', () => {
    const dir = tempDir('validate-arch-cfg-');
    try {
      writeTree(dir, {
        ...Object.fromEntries(Object.entries(validFeature('orders')).map(([k, v]) => [k.replace(DOCS, 'docs/design'), v])),
        '.claude/toolkit.json': JSON.stringify({ paths: { architectureDocs: 'docs/design' } }),
      });
      const r = runScript(SCRIPT, ['--json'], { cwd: dir });
      assert.equal(r.code, 0, r.stdout + r.stderr);
      assert.equal(parse(r.stdout).docsRoot, 'docs/design');
    } finally {
      cleanup(dir);
    }
  });

  test('--inventory prints declared endpoints, entities and tasks', () => {
    const r = runScript(SCRIPT, [DOCS, '--feature', 'orders', '--inventory'], { cwd });
    assert.equal(r.code, 0);
    const inv = parse(r.stdout);
    assert.equal(inv.docsRoot, DOCS);
    assert.equal(inv.features.length, 1);
    const [orders] = inv.features;
    assert.equal(orders.feature, 'orders');
    assert.deepEqual(orders.endpoints, [
      { n: '1', method: 'GET', path: '/orders', proposed: false, anchor: '1-get-orders', file: 'api-contract/orders.md' },
      { n: '2', method: 'POST', path: '/orders', proposed: true, anchor: '2-post-orders-proposed--not-in-code', file: 'api-contract/orders.md' },
    ]);
    assert.deepEqual(orders.entities, [{ table: 'orders', anchor: 'orders', file: 'data-model/orders.md' }]);
    assert.deepEqual(orders.tasks, [
      { file: 'tasks/01-contracts-and-validations.md', n: '01', implemented: false, superseded: false },
      { file: 'tasks/02-order-listing.md', n: '02', implemented: true, superseded: false },
    ]);
  });

  test('missing docs root exits 2', () => {
    const r = runScript(SCRIPT, ['does/not/exist'], { cwd });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /not found/);
  });

  test('unknown --feature exits 2', () => {
    const r = runScript(SCRIPT, [DOCS, '--feature', 'nope'], { cwd });
    assert.equal(r.code, 2);
    assert.match(r.stderr, /matching "nope"/);
  });
});
