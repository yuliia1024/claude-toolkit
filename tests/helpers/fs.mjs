// Small helpers shared by the test files: temp dirs, file trees, running scripts.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Creates a fresh temp dir; remove it with `cleanup(dir)`. */
export function tempDir(prefix = 'toolkit-test-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function cleanup(dir) {
  rmSync(dir, { recursive: true, force: true });
}

/** Writes `{ 'rel/path.md': 'content' }` under `root`, creating folders as needed. */
export function writeTree(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}

/** Runs a repo script with the current Node binary. */
export function runScript(script, args = [], { cwd, env = {}, input } = {}) {
  const res = spawnSync(process.execPath, [join(repoRoot, script), ...args], {
    cwd,
    input,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { code: res.status, stdout: res.stdout, stderr: res.stderr };
}
