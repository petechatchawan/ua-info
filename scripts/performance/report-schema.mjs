import { REQUIRED_SCENARIO_IDS } from '../../benchmarks/scenarios.mjs';
import { assertFiniteNonNegative } from './lib.mjs';

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function assertInteger(value, label, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${label} must be an integer >= ${minimum}, received ${value}.`);
  }
  return value;
}

function assertScenarioCollection(items, requiredIds, label, validateItem) {
  if (!Array.isArray(items)) throw new Error(`${label} must be an array.`);
  const seen = new Set();
  for (const item of items) {
    assertObject(item, `${label} item`);
    const id = assertString(item.id, `${label}.id`);
    if (seen.has(id)) throw new Error(`Duplicate scenario id: ${id}`);
    seen.add(id);
    validateItem(item, `${label}.${id}`);
  }
  const actualIds = [...seen];
  if (actualIds.length !== requiredIds.length || requiredIds.some((id) => !seen.has(id))) {
    throw new Error(`${label} must contain exactly: ${requiredIds.join(', ')}.`);
  }
}

function validateBaselineSource(value) {
  if (value === undefined) return;
  const source = assertObject(value, 'baselineSource');
  if (!(typeof source.runId === 'string' || Number.isInteger(source.runId))) {
    throw new Error('baselineSource.runId must be a string or integer.');
  }
  assertString(source.commit, 'baselineSource.commit');
  assertString(source.runner, 'baselineSource.runner');
}

export function validateReport(report) {
  assertObject(report, 'report');
  if (report.schemaVersion !== 1) {
    throw new Error(`Unsupported performance report schema: ${report.schemaVersion}.`);
  }
  if (report.policy !== 'report-only') {
    throw new Error(`Performance report policy must be report-only, received ${report.policy}.`);
  }
  assertString(report.generatedAt, 'generatedAt');

  const packageIdentity = assertObject(report.package, 'package');
  if (packageIdentity.name !== 'ua-info') {
    throw new Error(`Unexpected package identity: ${packageIdentity.name}.`);
  }
  assertString(packageIdentity.version, 'package.version');

  const environment = assertObject(report.environment, 'environment');
  for (const key of ['platform', 'arch', 'node', 'npm', 'esbuild']) {
    assertString(environment[key], `environment.${key}`);
  }
  if (environment.commit !== null) assertString(environment.commit, 'environment.commit');

  const sizes = assertObject(report.sizes, 'sizes');
  const packageSizes = assertObject(sizes.package, 'sizes.package');
  assertFiniteNonNegative(packageSizes.tarballBytes, 'sizes.package.tarballBytes');
  assertFiniteNonNegative(packageSizes.unpackedBytes, 'sizes.package.unpackedBytes');
  assertInteger(packageSizes.fileCount, 'sizes.package.fileCount', 1);

  assertScenarioCollection(
    sizes.distributions,
    ['esm', 'cjs'],
    'sizes.distributions',
    (item, label) => {
      assertFiniteNonNegative(item.rawBytes, `${label}.rawBytes`);
      assertInteger(item.fileCount, `${label}.fileCount`, 1);
    },
  );

  assertScenarioCollection(
    sizes.bundles,
    REQUIRED_SCENARIO_IDS.bundles,
    'sizes.bundles',
    (item, label) => {
      if (item.platform !== 'node' && item.platform !== 'browser') {
        throw new Error(`${label}.platform must be node or browser.`);
      }
      for (const key of ['rawBytes', 'gzipBytes', 'brotliBytes']) {
        assertFiniteNonNegative(item[key], `${label}.${key}`);
      }
    },
  );

  const runtime = assertObject(report.runtime, 'runtime');
  assertScenarioCollection(
    runtime.coldImports,
    REQUIRED_SCENARIO_IDS.coldImports,
    'runtime.coldImports',
    (item, label) => {
      assertInteger(item.sampleCount, `${label}.sampleCount`, 1);
      for (const key of [
        'medianMilliseconds',
        'p95Milliseconds',
        'minimumMilliseconds',
        'maximumMilliseconds',
      ]) {
        assertFiniteNonNegative(item[key], `${label}.${key}`);
      }
    },
  );

  assertScenarioCollection(
    runtime.parseThroughput,
    REQUIRED_SCENARIO_IDS.parseThroughput,
    'runtime.parseThroughput',
    (item, label) => {
      assertInteger(item.iterations, `${label}.iterations`, 1);
      assertInteger(item.sampleCount, `${label}.sampleCount`, 1);
      assertFiniteNonNegative(
        item.medianOperationsPerSecond,
        `${label}.medianOperationsPerSecond`,
      );
      assertFiniteNonNegative(
        item.p95NanosecondsPerOperation,
        `${label}.p95NanosecondsPerOperation`,
      );
      assertFiniteNonNegative(item.checksum, `${label}.checksum`);
      if (item.checksum <= 0) throw new Error(`${label}.checksum must be greater than zero.`);
    },
  );

  validateBaselineSource(report.baselineSource);
  return report;
}
