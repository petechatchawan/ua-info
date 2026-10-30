import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGatePolicy } from './gate-policy.mjs';
import { readJson, writeJson } from './lib.mjs';
import { validateReport } from './report-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);
const rootDirectory = path.resolve(path.dirname(modulePath), '../..');
const DEFAULT_REPORT = 'artifacts/performance/performance-report.json';
const DEFAULT_POLICY = 'benchmarks/performance-gate-policy.json';

/**
 * Static sizes are deterministic for a given build and the pinned esbuild, so they come from the
 * current report. Runtime numbers are advisory and platform dependent, so they stay with the last
 * baseline that a CI run produced.
 */
export function buildUpdatedBaseline({ baseline, report }) {
  validateReport(baseline);
  validateReport(report);
  return {
    ...baseline,
    generatedAt: report.generatedAt,
    package: report.package,
    sizes: report.sizes,
    baselineSource: {
      runId: 'budget-update',
      commit: report.environment.commit ?? 'unavailable',
      runner: `${report.environment.platform}-${report.environment.arch} Node.js ${report.environment.node} (static sizes only)`,
    },
  };
}

export async function runBudgetUpdate({
  reportPath = DEFAULT_REPORT,
  policyPath = DEFAULT_POLICY,
} = {}) {
  const policy = await loadGatePolicy(path.resolve(rootDirectory, policyPath));
  const baselinePath = path.resolve(rootDirectory, policy.baseline);
  const [baseline, report] = await Promise.all([
    readJson(baselinePath),
    readJson(path.resolve(rootDirectory, reportPath)),
  ]);
  const updated = buildUpdatedBaseline({ baseline, report });
  await writeJson(baselinePath, updated);
  return { baselinePath: policy.baseline, updated };
}

if (process.argv[1] === modulePath) {
  try {
    const { baselinePath, updated } = await runBudgetUpdate();
    const bundles = updated.sizes.bundles.map((item) => `${item.id}=${item.rawBytes}`).join(', ');
    process.stdout.write(`Updated ${baselinePath} (${updated.package.version}). Raw bundle bytes: ${bundles}.\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}
