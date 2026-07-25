import { readJson } from './lib.mjs';

const EXPECTED = Object.freeze({
  topLevel: ['schemaVersion', 'mode', 'baseline', 'requiredEsbuild', 'blocking', 'advisory'],
  blocking: ['package', 'distributions', 'bundles'],
  advisory: [
    'package',
    'bundles',
    'coldImportSlowdownPercent',
    'parseThroughputDropPercent',
  ],
  metrics: {
    blockingPackage: ['unpackedBytes', 'fileCount'],
    blockingDistributions: ['rawBytes', 'fileCount'],
    blockingBundles: ['rawBytes'],
    advisoryPackage: ['tarballBytes'],
    advisoryBundles: ['gzipBytes', 'brotliBytes'],
  },
});

function invalid(message, cause) {
  return new Error(`PERF_GATE_POLICY_INVALID: ${message}`, cause ? { cause } : undefined);
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${label} must be an object.`);
  }
  return value;
}

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(assertObject(value, label)).sort();
  const required = [...expected].sort();
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    throw invalid(`${label} must contain exactly: ${expected.join(', ')}.`);
  }
}

function assertExactArray(value, expected, label) {
  if (!Array.isArray(value)) throw invalid(`${label} must be an array.`);
  if (new Set(value).size !== value.length) throw invalid(`${label} contains duplicate metrics.`);
  if (value.length !== expected.length || value.some((item, index) => item !== expected[index])) {
    throw invalid(`${label} must equal: ${expected.join(', ')}.`);
  }
}

function assertThreshold(value, label) {
  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    throw invalid(`${label} must be within (0, 100].`);
  }
}

export function validateGatePolicy(policy) {
  assertExactKeys(policy, EXPECTED.topLevel, 'policy');
  if (policy.schemaVersion !== 1) throw invalid(`Unsupported schemaVersion ${policy.schemaVersion}.`);
  if (policy.mode !== 'static-hard-gate') throw invalid(`Unsupported mode ${policy.mode}.`);
  if (typeof policy.baseline !== 'string' || policy.baseline.trim().length === 0) {
    throw invalid('baseline must be a non-empty path.');
  }
  if (policy.requiredEsbuild !== '0.25.8') {
    throw invalid('requiredEsbuild must be exactly 0.25.8.');
  }

  assertExactKeys(policy.blocking, EXPECTED.blocking, 'blocking');
  assertExactArray(
    policy.blocking.package,
    EXPECTED.metrics.blockingPackage,
    'blocking.package',
  );
  assertExactArray(
    policy.blocking.distributions,
    EXPECTED.metrics.blockingDistributions,
    'blocking.distributions',
  );
  assertExactArray(
    policy.blocking.bundles,
    EXPECTED.metrics.blockingBundles,
    'blocking.bundles',
  );

  assertExactKeys(policy.advisory, EXPECTED.advisory, 'advisory');
  assertExactArray(
    policy.advisory.package,
    EXPECTED.metrics.advisoryPackage,
    'advisory.package',
  );
  assertExactArray(
    policy.advisory.bundles,
    EXPECTED.metrics.advisoryBundles,
    'advisory.bundles',
  );
  assertThreshold(
    policy.advisory.coldImportSlowdownPercent,
    'advisory.coldImportSlowdownPercent',
  );
  assertThreshold(
    policy.advisory.parseThroughputDropPercent,
    'advisory.parseThroughputDropPercent',
  );
  return policy;
}

export async function loadGatePolicy(filePath) {
  try {
    return validateGatePolicy(await readJson(filePath));
  } catch (error) {
    if (error?.message?.startsWith('PERF_GATE_POLICY_INVALID:')) throw error;
    throw new Error(`PERF_GATE_IO_ERROR: Unable to read gate policy at ${filePath}.`, {
      cause: error,
    });
  }
}
