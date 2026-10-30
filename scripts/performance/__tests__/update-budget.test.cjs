function createReport(overrides = {}) {
  return {
    schemaVersion: 1,
    policy: 'report-only',
    generatedAt: '2026-10-30T00:00:00.000Z',
    package: { name: 'user-agent-parser-ts', version: '3.0.1' },
    environment: {
      platform: 'darwin',
      arch: 'arm64',
      node: 'v24.18.0',
      npm: '11.16.0',
      esbuild: '0.25.8',
      commit: 'abc1234',
    },
    sizes: {
      package: { tarballBytes: 100, unpackedBytes: 500, fileCount: 10 },
      distributions: [
        { id: 'esm', rawBytes: 200, fileCount: 5 },
        { id: 'cjs', rawBytes: 180, fileCount: 4 },
      ],
      bundles: ['root-parse', 'root-predicate', 'server-parse-request', 'browser-detect-current'].map((id, index) => ({
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
      parseThroughput: ['desktop-chromium', 'mobile-safari', 'line-liff', 'crawler', 'malformed', 'mixed-corpus'].map((id) => ({
        id,
        iterations: 20_000,
        sampleCount: 15,
        medianOperationsPerSecond: 100_000,
        p95NanosecondsPerOperation: 12_000,
        checksum: 1,
      })),
    },
    ...overrides,
  };
}

describe('budget update', () => {
  let buildUpdatedBaseline;

  beforeAll(async () => {
    ({ buildUpdatedBaseline } = await import('../update-budget.mjs'));
  });

  test('takes static sizes and package identity from the report', () => {
    const baseline = createReport({ package: { name: 'user-agent-parser-ts', version: '2.2.0' } });
    const report = createReport();
    report.sizes.bundles[0].rawBytes = 1234;

    const updated = buildUpdatedBaseline({ baseline, report });

    expect(updated.sizes).toEqual(report.sizes);
    expect(updated.package).toEqual({ name: 'user-agent-parser-ts', version: '3.0.1' });
    expect(updated.generatedAt).toBe(report.generatedAt);
  });

  test('keeps the runtime numbers and environment of the last CI baseline', () => {
    const baseline = createReport({
      environment: { platform: 'linux', arch: 'x64', node: 'v22.23.1', npm: '10.9.8', esbuild: '0.25.8', commit: 'ci0001' },
    });
    baseline.runtime.parseThroughput[0].medianOperationsPerSecond = 143_452;

    const updated = buildUpdatedBaseline({ baseline, report: createReport() });

    expect(updated.runtime).toEqual(baseline.runtime);
    expect(updated.environment).toEqual(baseline.environment);
  });

  test('records that only static sizes came from this run', () => {
    const updated = buildUpdatedBaseline({ baseline: createReport(), report: createReport() });

    expect(updated.baselineSource).toEqual({
      runId: 'budget-update',
      commit: 'abc1234',
      runner: 'darwin-arm64 Node.js v24.18.0 (static sizes only)',
    });
  });

  test('rejects a report that does not match the schema', () => {
    const report = createReport();
    report.sizes.bundles.pop();
    expect(() => buildUpdatedBaseline({ baseline: createReport(), report })).toThrow('sizes.bundles must contain exactly');
  });
});
