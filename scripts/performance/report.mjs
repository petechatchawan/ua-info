import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectRuntime } from './collect-runtime.mjs';
import { collectSizes } from './collect-sizes.mjs';
import { readJson, run, writeJson } from './lib.mjs';
import { renderSummary } from './render-summary.mjs';
import { validateReport } from './report-schema.mjs';

const modulePath = fileURLToPath(import.meta.url);
const rootDirectory = path.resolve(path.dirname(modulePath), '../..');
const outputDirectory = path.join(rootDirectory, 'artifacts', 'performance');
const reportPath = path.join(outputDirectory, 'performance-report.json');
const summaryPath = path.join(outputDirectory, 'performance-summary.md');
const baselinePath = path.join(
  rootDirectory,
  'benchmarks',
  'baselines',
  'ua-info-2.2.0-node22-linux-x64.json',
);

async function resolveCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return (await run('git', ['rev-parse', 'HEAD'], { cwd: rootDirectory })).stdout;
  } catch {
    return null;
  }
}

export async function createPerformanceReport() {
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  await run('npm', ['run', 'build'], { cwd: rootDirectory });
  const [packageJson, npmVersion, commit, sizes, runtime] = await Promise.all([
    readJson(path.join(rootDirectory, 'package.json')),
    run('npm', ['--version'], { cwd: rootDirectory }).then(({ stdout }) => stdout),
    resolveCommit(),
    collectSizes({ rootDirectory }),
    collectRuntime({ rootDirectory }),
  ]);

  const report = {
    schemaVersion: 1,
    policy: 'report-only',
    generatedAt: new Date().toISOString(),
    package: {
      name: packageJson.name,
      version: packageJson.version,
    },
    environment: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      npm: npmVersion,
      esbuild: sizes.toolchain.esbuild,
      commit,
    },
    sizes: {
      package: {
        tarballBytes: sizes.package.tarballBytes,
        unpackedBytes: sizes.package.unpackedBytes,
        fileCount: sizes.package.fileCount,
      },
      distributions: sizes.distributions,
      bundles: sizes.bundles,
    },
    runtime,
  };

  validateReport(report);
  const baseline = existsSync(baselinePath) ? await readJson(baselinePath) : null;
  if (baseline) validateReport(baseline);
  const summary = renderSummary(report, baseline);

  await writeJson(reportPath, report);
  await writeFile(summaryPath, summary);
  process.stdout.write(`${summary}\n`);
  return { report, reportPath, summary, summaryPath };
}

if (process.argv[1] === modulePath) {
  await createPerformanceReport();
}
