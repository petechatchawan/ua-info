function createReport() {
  return {
    schemaVersion: 1,
    policy: 'report-only',
    generatedAt: '2026-07-26T00:00:00.000Z',
    package: { name: 'user-agent-parser-ts', version: '2.2.0' },
    environment: {
      platform: 'linux',
      arch: 'x64',
      node: 'v22.23.1',
      npm: '10.9.8',
      esbuild: '0.25.8',
      commit: null,
    },
    sizes: {
      package: { tarballBytes: 100, unpackedBytes: 500, fileCount: 10 },
      distributions: [
        { id: 'esm', rawBytes: 200, fileCount: 5 },
        { id: 'cjs', rawBytes: 180, fileCount: 4 },
      ],
      bundles: [
        'root-parse',
        'root-predicate',
        'server-parse-request',
        'browser-detect-current',
      ].map((id, index) => ({
        id,
        platform: id === 'browser-detect-current' ? 'browser' : 'node',
        rawBytes: 1000 + index,
        gzipBytes: 500 + index,
        brotliBytes: 450 + index,
      })),
    },
    runtime: {
      coldImports: ['root-esm', 'root-cjs', 'server-esm', 'browser-esm'].map((id) => ({
        id,
        kind: id === 'root-cjs' ? 'require' : 'import',
        sampleCount: 15,
        medianMilliseconds: 2,
        p95Milliseconds: 3,
        minimumMilliseconds: 1,
        maximumMilliseconds: 4,
      })),
      parseThroughput: [
        'desktop-chromium',
        'mobile-safari',
        'line-liff',
        'crawler',
        'malformed',
        'mixed-corpus',
      ].map((id) => ({
        id,
        iterations: 20_000,
        sampleCount: 15,
        medianOperationsPerSecond: 100_000,
        p95NanosecondsPerOperation: 12_000,
        checksum: 1,
      })),
    },
  };
}

function createPolicy() {
  return {
    schemaVersion: 1,
    mode: 'static-hard-gate',
    baseline: 'benchmarks/baselines/reviewed-node22-linux-x64.json',
    requiredEsbuild: '0.25.8',
    staleBudgetPercent: 10,
    blocking: {
      package: [],
      distributions: [],
      bundles: ['rawBytes'],
    },
    advisory: {
      package: ['tarballBytes'],
      bundles: ['gzipBytes', 'brotliBytes'],
      coldImportSlowdownPercent: 25,
      parseThroughputDropPercent: 15,
    },
  };
}

describe('performance gate evaluator', () => {
  let evaluatePerformanceGate;

  beforeAll(async () => {
    ({ evaluatePerformanceGate } = await import('../gate-evaluator.mjs'));
  });

  test('passes equality and deterministic decreases', () => {
    const baseline = createReport();
    const equal = evaluatePerformanceGate({
      report: structuredClone(baseline),
      baseline,
      policy: createPolicy(),
    });
    expect(equal.status).toBe('pass');
    expect(equal.blockingViolations).toEqual([]);

    const smaller = structuredClone(baseline);
    smaller.sizes.package.unpackedBytes -= 1;
    smaller.sizes.package.fileCount -= 1;
    smaller.sizes.distributions[0].rawBytes -= 1;
    smaller.sizes.distributions[0].fileCount -= 1;
    smaller.sizes.distributions[1].rawBytes -= 1;
    smaller.sizes.distributions[1].fileCount -= 1;
    for (const bundle of smaller.sizes.bundles) bundle.rawBytes -= 1;

    expect(evaluatePerformanceGate({
      report: smaller,
      baseline,
      policy: createPolicy(),
    }).status).toBe('pass');
  });

  test.each([
    ['sizes.bundles.root-parse.rawBytes', (report) => { report.sizes.bundles[0].rawBytes += 1; }],
    ['sizes.bundles.root-predicate.rawBytes', (report) => { report.sizes.bundles[1].rawBytes += 1; }],
    ['sizes.bundles.server-parse-request.rawBytes', (report) => { report.sizes.bundles[2].rawBytes += 1; }],
    ['sizes.bundles.browser-detect-current.rawBytes', (report) => { report.sizes.bundles[3].rawBytes += 1; }],
  ])('blocks bundle growth for %s', (path, mutate) => {
    const baseline = createReport();
    const report = structuredClone(baseline);
    mutate(report);
    const result = evaluatePerformanceGate({ report, baseline, policy: createPolicy() });
    expect(result.status).toBe('fail');
    expect(result.blockingViolations).toEqual([
      expect.objectContaining({
        code: 'PERF_GATE_STATIC_BUDGET_EXCEEDED',
        path,
        delta: 1,
      }),
    ]);
  });

  test('blocks a budget that is more than the stale threshold above the measured size', () => {
    const baseline = createReport();
    const report = structuredClone(baseline);
    report.sizes.bundles[0].rawBytes = Math.floor(baseline.sizes.bundles[0].rawBytes * 0.89);
    const result = evaluatePerformanceGate({ report, baseline, policy: createPolicy() });
    expect(result.status).toBe('fail');
    expect(result.blockingViolations).toEqual([
      expect.objectContaining({
        code: 'PERF_GATE_BUDGET_STALE',
        path: 'sizes.bundles.root-parse.rawBytes',
      }),
    ]);
  });

  test('passes a decrease inside the stale threshold', () => {
    const baseline = createReport();
    const report = structuredClone(baseline);
    report.sizes.bundles[0].rawBytes = Math.ceil(baseline.sizes.bundles[0].rawBytes * 0.91);
    expect(evaluatePerformanceGate({ report, baseline, policy: createPolicy() }).status).toBe('pass');
  });

  test('does not block package or distribution growth', () => {
    const baseline = createReport();
    const report = structuredClone(baseline);
    report.sizes.package.unpackedBytes += 100;
    report.sizes.package.fileCount += 10;
    report.sizes.distributions[0].rawBytes += 100;
    report.sizes.distributions[0].fileCount += 10;
    report.sizes.distributions[1].rawBytes += 100;
    report.sizes.distributions[1].fileCount += 10;

    const result = evaluatePerformanceGate({ report, baseline, policy: createPolicy() });
    expect(result.status).toBe('pass');
    expect(result.blockingViolations).toEqual([]);
  });

  test('returns all blocking bundle violations in deterministic order', () => {
    const baseline = createReport();
    const report = structuredClone(baseline);
    report.sizes.bundles[0].rawBytes += 1;
    report.sizes.bundles[2].rawBytes += 4;

    const result = evaluatePerformanceGate({ report, baseline, policy: createPolicy() });
    expect(result.blockingViolations.map((item) => item.path)).toEqual([
      'sizes.bundles.root-parse.rawBytes',
      'sizes.bundles.server-parse-request.rawBytes',
    ]);
  });

  test('keeps tarball, compressed and runtime regressions advisory', () => {
    const baseline = createReport();
    const report = structuredClone(baseline);
    report.sizes.package.tarballBytes += 1;
    report.sizes.bundles[0].gzipBytes += 1;
    report.sizes.bundles[0].brotliBytes += 1;
    report.runtime.coldImports[0].medianMilliseconds *= 1.2501;
    report.runtime.parseThroughput[0].medianOperationsPerSecond *= 0.8499;

    const result = evaluatePerformanceGate({ report, baseline, policy: createPolicy() });
    expect(result.status).toBe('pass');
    expect(result.blockingViolations).toEqual([]);
    expect(result.warnings.map((item) => item.code)).toEqual([
      'PERF_GATE_TARBALL_GROWTH',
      'PERF_GATE_COMPRESSED_GROWTH',
      'PERF_GATE_COMPRESSED_GROWTH',
      'PERF_GATE_COLD_IMPORT_SLOWDOWN',
      'PERF_GATE_THROUGHPUT_DROP',
    ]);
  });

  test('does not warn at exact runtime boundaries', () => {
    const baseline = createReport();
    const report = structuredClone(baseline);
    report.runtime.coldImports[0].medianMilliseconds *= 1.25;
    report.runtime.parseThroughput[0].medianOperationsPerSecond *= 0.85;
    expect(evaluatePerformanceGate({ report, baseline, policy: createPolicy() }).warnings).toEqual([]);
  });

  test('allows version changes for the same package baseline', () => {
    const baseline = createReport();
    const report = createReport();
    report.package.version = '3.0.0';

    expect(() => evaluatePerformanceGate({
      report,
      baseline,
      policy: createPolicy(),
    })).not.toThrow();
  });

  test('rejects package name mismatches', () => {
    const baseline = createReport();
    const wrongCurrentName = createReport();
    wrongCurrentName.package.name = 'other-package';

    expect(() => evaluatePerformanceGate({
      report: wrongCurrentName,
      baseline,
      policy: createPolicy(),
    })).toThrow('PERF_GATE_REPORT_INVALID');
  });

  test('rejects current and baseline esbuild mismatches', () => {
    const baseline = createReport();

    const wrongCurrent = createReport();
    wrongCurrent.environment.esbuild = '0.25.9';
    expect(() => evaluatePerformanceGate({
      report: wrongCurrent,
      baseline,
      policy: createPolicy(),
    })).toThrow('PERF_GATE_TOOLCHAIN_MISMATCH');

    const wrongBaseline = createReport();
    wrongBaseline.environment.esbuild = '0.25.7';
    expect(() => evaluatePerformanceGate({
      report: createReport(),
      baseline: wrongBaseline,
      policy: createPolicy(),
    })).toThrow('PERF_GATE_TOOLCHAIN_MISMATCH');
  });
});
