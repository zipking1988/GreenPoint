import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// Shared by sequential sprint experiments. Unknown billing retains the full
// reservation. Never infer a zero bill from an unsuccessful request.
export class ExperimentBudget {
  constructor(file, limit = 10) { this.file = file; this.limit = limit; }
  async read() {
    try { return JSON.parse(await readFile(this.file, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; return { limit_usd: this.limit, entries: [] }; }
  }
  async save(ledger) {
    await mkdir(dirname(this.file), { recursive: true });
    await writeFile(this.file, JSON.stringify(ledger, null, 2) + '\n', { mode: 0o600 });
  }
  async reserve(label, usd, regression = false) {
    if (!Number.isFinite(usd) || usd <= 0) throw new Error('Budget reservations must be positive finite dollars.');
    const ledger = await this.read();
    const total = ledger.entries.reduce((n, e) => n + (e.actual_usd ?? e.reserved_usd), 0);
    if (total + usd > (regression ? this.limit : Math.min(8, this.limit))) throw new Error('Experiment budget reached. No further provider request was made.');
    const id = crypto.randomUUID();
    ledger.entries.push({ id, label, reserved_usd: usd, created_at: new Date().toISOString() });
    await this.save(ledger);
    return id;
  }
  async settle(id, usage) {
    if (!Number.isFinite(usage?.estimatedUsd) || usage.estimatedUsd < 0) return;
    const ledger = await this.read();
    const entry = ledger.entries.find(e => e.id === id);
    if (!entry) throw new Error('Unknown budget reservation.');
    entry.actual_usd = usage.estimatedUsd;
    entry.usage = usage;
    await this.save(ledger);
  }
}
