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

  test('rejects duplicate and unsupported metric names', () => {
    const duplicate = policy();
    duplicate.blocking.package = ['unpackedBytes', 'unpackedBytes'];
    expect(() => validateGatePolicy(duplicate)).toThrow('PERF_GATE_POLICY_INVALID');

    const unsupported = policy();
    unsupported.advisory.bundles = ['gzipBytes', 'rawBytes'];
    expect(() => validateGatePolicy(unsupported)).toThrow('PERF_GATE_POLICY_INVALID');
  });

  test.each([0, -1, 101, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid warning threshold %p',
    (threshold) => {
      const value = policy();
      value.advisory.coldImportSlowdownPercent = threshold;
      expect(() => validateGatePolicy(value)).toThrow('PERF_GATE_POLICY_INVALID');
    },
  );
});
