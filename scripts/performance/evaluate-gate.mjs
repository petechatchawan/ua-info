import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluatePerformanceGate } from './gate-evaluator.mjs';
import { loadGatePolicy } from './gate-policy.mjs';
import { readJson, writeJson } from './lib.mjs';
import { renderGateSummary } from './render-gate-summary.mjs';

const modulePath = fileURLToPath(import.meta.url);
const rootDirectory = path.resolve(path.dirname(modulePath), '../..');
const REQUIRED_ARGUMENTS = ['report', 'policy', 'output', 'summary'];

function argumentError(message) {
  return new Error(`PERF_GATE_ARGUMENT_INVALID: ${message}`);
}

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith('--') || !value || value.startsWith('--')) {
      throw argumentError('Arguments must use --name value pairs.');
    }
    const key = flag.slice(2);
    if (!REQUIRED_ARGUMENTS.includes(key)) throw argumentError(`Unsupported argument --${key}.`);
    if (values[key]) throw argumentError(`Duplicate argument --${key}.`);
    values[key] = value;
  }
  const missing = REQUIRED_ARGUMENTS.filter((key) => !values[key]);
  if (missing.length > 0) throw argumentError(`Missing arguments: ${missing.map((key) => `--${key}`).join(', ')}.`);
  return values;
}

async function readReport(filePath, label) {
  try {
    return await readJson(filePath);
  } catch (error) {
    throw new Error(`PERF_GATE_IO_ERROR: Unable to read ${label} at ${filePath}.`, {
      cause: error,
    });
  }
}

async function writeSummary(filePath, summary) {
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, summary);
  } catch (error) {
    throw new Error(`PERF_GATE_IO_ERROR: Unable to write summary at ${filePath}.`, {
      cause: error,
    });
  }
}

export async function runGateCli(argv = process.argv.slice(2)) {
  const args = parseArguments(argv);
  const reportPath = path.resolve(args.report);
  const policyPath = path.resolve(args.policy);
  const outputPath = path.resolve(args.output);
  const summaryPath = path.resolve(args.summary);

  const policy = await loadGatePolicy(policyPath);
  const baselinePath = path.resolve(rootDirectory, policy.baseline);
  const [report, baseline] = await Promise.all([
    readReport(reportPath, 'performance report'),
    readReport(baselinePath, 'performance baseline'),
  ]);
  const result = evaluatePerformanceGate({ report, baseline, policy });
  const summary = renderGateSummary({
    result,
    report,
    baseline,
    policy,
    baselinePath: policy.baseline,
  });

  try {
    await writeJson(outputPath, result);
  } catch (error) {
    throw new Error(`PERF_GATE_IO_ERROR: Unable to write gate result at ${outputPath}.`, {
      cause: error,
    });
  }
  await writeSummary(summaryPath, summary);
  process.stdout.write(summary);
  return { result, outputPath, summary, summaryPath };
}

if (process.argv[1] === modulePath) {
  try {
    const { result } = await runGateCli();
    process.exitCode = result.status === 'fail' ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 2;
  }
}
