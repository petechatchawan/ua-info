const VALID_POLICY = Object.freeze({
  schemaVersion: 1,
  mode: 'static-hard-gate',
  baseline: 'benchmarks/baselines/ua-info-2.2.0-node22-linux-x64.json',
  requiredEsbuild: '0.25.8',
  blocking: {
    package: ['unpackedBytes', 'fileCount'],
    distributions: ['rawBytes', 'fileCount'],
    bundles: ['rawBytes'],
  },
  advisory: {
    package: ['tarballBytes'],
    bundles: ['gzipBytes', 'brotliBytes'],
    coldImportSlowdownPercent: 25,
    parseThroughputDropPercent: 15,
  },
});

function policy(overrides = {}) {
  return structuredClone({ ...VALID_POLICY, ...overrides });
}

describe('performance gate policy', () => {
  let validateGatePolicy;

  beforeAll(async () => {
    ({ validateGatePolicy } = await import('../gate-policy.mjs'));
  });

  test('accepts the exact reviewed policy', () => {
    const value = policy();
    expect(validateGatePolicy(value)).toBe(value);
  });

  test.each([
    ['schemaVersion', { schemaVersion: 2 }],
    ['mode', { mode: 'report-only' }],
    ['baseline', { baseline: '' }],
    ['requiredEsbuild', { requiredEsbuild: '^0.25.8' }],
    ['unknown field', { unexpected: true }],
  ])('rejects invalid %s', (_label, overrides) => {
    expect(() => validateGatePolicy(policy(overrides))).toThrow('PERF_GATE_POLICY_INVALID');
  });

  test('rejects unknown nested fields', () => {
    const blocking = policy();
    blocking.blocking.unexpected = [];
    expect(() => validateGatePolicy(blocking)).toThrow('PERF_GATE_POLICY_INVALID');

    const advisory = policy();
    advisory.advisory.unexpected = 1;
    expect(() => validateGatePolicy(advisory)).toThrow('PERF_GATE_POLICY_INVALID');
  });

  test('rejects duplicate and unsupported metric names', () => {
    const duplicate = policy();
    duplicate.blocking.package = ['unpackedBytes', 'unpackedBytes'];
    expect(() => validateGatePolicy(duplicate)).toThrow('PERF_GATE_POLICY_INVALID');

    const unsupported = policy();
    unsupported.advisory.bundles = ['gzipBytes', 'rawBytes'];
    expect(() => validateGatePolicy(unsupported)).toThrow('PERF_GATE_POLICY_INVALID');
  });

  test.each([
    ['coldImportSlowdownPercent', 0],
    ['coldImportSlowdownPercent', -1],
    ['coldImportSlowdownPercent', 101],
    ['coldImportSlowdownPercent', Number.NaN],
    ['coldImportSlowdownPercent', Number.POSITIVE_INFINITY],
    ['parseThroughputDropPercent', 0],
    ['parseThroughputDropPercent', -1],
    ['parseThroughputDropPercent', 101],
    ['parseThroughputDropPercent', Number.NaN],
    ['parseThroughputDropPercent', Number.POSITIVE_INFINITY],
  ])('rejects invalid %s threshold %p', (field, threshold) => {
    const value = policy();
    value.advisory[field] = threshold;
    expect(() => validateGatePolicy(value)).toThrow('PERF_GATE_POLICY_INVALID');
  });
});
