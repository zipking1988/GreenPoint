// All paid operations remain sequential and use the shared ledger in run_sam.mjs.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const bytes = await readFile(new URL('../selection.json', import.meta.url));
const freeze = JSON.parse(await readFile(new URL('../selection-freeze.json', import.meta.url), 'utf8'));
if (createHash('sha256').update(bytes).digest('hex') !== freeze.selection_sha256) throw new Error('Selection changed after freezing.');
const selection = JSON.parse(bytes);
for (const args of [
  ['scripts/run_sam.mjs','--phase','confirmatory','--geometry','whole','--classify','--live'],
  ['scripts/run_sam.mjs','--phase','confirmatory','--geometry',selection.geometry,'--live'],
  ['scripts/prepare_masks.mjs','--phase','confirmatory','--geometry','whole'],
  ['scripts/prepare_masks.mjs','--phase','confirmatory','--geometry',selection.geometry],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status || 1);
}
