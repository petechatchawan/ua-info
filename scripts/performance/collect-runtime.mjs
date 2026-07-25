import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  COLD_IMPORT_SCENARIOS,
  THROUGHPUT_SCENARIOS,
} from '../../benchmarks/scenarios.mjs';
import {
  assertFiniteNonNegative,
  median,
  percentile,
  run,
  writeJson,
} from './lib.mjs';

const modulePath = fileURLToPath(import.meta.url);
const moduleDirectory = path.dirname(modulePath);
const defaultRootDirectory = path.resolve(moduleDirectory, '../..');
const workerPath = path.join(moduleDirectory, 'import-worker.mjs');

function parseWorkerResult(stdout, scenarioId) {
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Cold import scenario ${scenarioId} returned invalid JSON.`, {
      cause: error,
    });
  }
  assertFiniteNonNegative(parsed.milliseconds, `${scenarioId}.milliseconds`);
  return parsed.milliseconds;
}

async function measureColdImport(rootDirectory, scenario) {
  const target = path.join(rootDirectory, scenario.target);
  const samples = [];
  for (let index = 0; index < 18; index += 1) {
    const { stdout } = await run(process.execPath, [
      workerPath,
      '--kind',
      scenario.kind,
      '--target',
      target,
    ]);
    const milliseconds = parseWorkerResult(stdout, scenario.id);
    if (index >= 3) samples.push(milliseconds);
  }
  return {
    id: scenario.id,
    kind: scenario.kind,
    sampleCount: samples.length,
    medianMilliseconds: median(samples),
    p95Milliseconds: percentile(samples, 95),
    minimumMilliseconds: Math.min(...samples),
    maximumMilliseconds: Math.max(...samples),
  };
}

function resultChecksum(result) {
  return (
    1 +
    result.ua.length +
    (result.browser?.id?.length ?? 0) +
    (result.browser?.version?.raw?.length ?? 0) +
    (result.engine?.id?.length ?? 0) +
    (result.os?.id?.length ?? 0) +
    (result.device?.type?.length ?? 0) +
    (result.cpu?.architecture?.length ?? 0) +
    (result.client?.kind?.length ?? 0) +
    (result.context?.kind?.length ?? 0)
  );
}

function measureThroughputSample(parse, scenario) {
  let checksum = 0;
  const startedAt = performance.now();
  for (let index = 0; index < scenario.iterations; index += 1) {
    const userAgent = scenario.userAgents[index % scenario.userAgents.length];
    checksum += resultChecksum(parse(userAgent));
  }
  const elapsedMilliseconds = performance.now() - startedAt;
  const operationsPerSecond = scenario.iterations / (elapsedMilliseconds / 1000);
  const nanosecondsPerOperation = (elapsedMilliseconds * 1_000_000) / scenario.iterations;
  assertFiniteNonNegative(operationsPerSecond, `${scenario.id}.operationsPerSecond`);
  assertFiniteNonNegative(nanosecondsPerOperation, `${scenario.id}.nanosecondsPerOperation`);
  return { operationsPerSecond, nanosecondsPerOperation, checksum };
}

function measureThroughput(parse, scenario) {
  for (let index = 0; index < 5; index += 1) {
    measureThroughputSample(parse, scenario);
  }
  const samples = [];
  let checksum = 0;
  for (let index = 0; index < 15; index += 1) {
    const sample = measureThroughputSample(parse, scenario);
    samples.push(sample);
    checksum += sample.checksum;
  }
  if (!Number.isFinite(checksum) || checksum <= 0) {
    throw new Error(`Throughput scenario ${scenario.id} produced an invalid checksum.`);
  }
  return {
    id: scenario.id,
    iterations: scenario.iterations,
    sampleCount: samples.length,
    medianOperationsPerSecond: median(samples.map((sample) => sample.operationsPerSecond)),
    p95NanosecondsPerOperation: percentile(
      samples.map((sample) => sample.nanosecondsPerOperation),
      95,
    ),
    checksum,
  };
}

export async function collectRuntime({ rootDirectory = defaultRootDirectory } = {}) {
  const moduleUrl = `${pathToFileURL(path.join(rootDirectory, 'dist', 'esm', 'index.js')).href}?runtime=${process.pid}`;
  const { parse } = await import(moduleUrl);
  if (typeof parse !== 'function') {
    throw new Error('Built ESM root does not export parse().');
  }

  const coldImports = [];
  for (const scenario of COLD_IMPORT_SCENARIOS) {
    coldImports.push(await measureColdImport(rootDirectory, scenario));
  }

  return {
    coldImports,
    parseThroughput: THROUGHPUT_SCENARIOS.map((scenario) =>
      measureThroughput(parse, scenario),
    ),
  };
}

function readOutputArgument(argv) {
  const index = argv.indexOf('--output');
  return index >= 0 ? argv[index + 1] : null;
}

if (process.argv[1] === modulePath) {
  const result = await collectRuntime();
  const output = readOutputArgument(process.argv.slice(2));
  if (output) {
    await writeJson(path.resolve(output), result);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
