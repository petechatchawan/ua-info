function createReport() {
  return {
    schemaVersion: 1,
    policy: 'report-only',
    generatedAt: '2026-07-26T00:00:00.000Z',
    package: { name: 'ua-info', version: '2.2.0' },
    environment: {
      platform: 'linux',
      arch: 'x64',
      node: 'v22.0.0',
      npm: '11.0.0',
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

describe('performance report schema and summary', () => {
  let validateReport;
  let renderSummary;

  beforeAll(async () => {
    ({ validateReport } = await import('../report-schema.mjs'));
    ({ renderSummary } = await import('../render-summary.mjs'));
  });

  test('accepts a complete report-only document', () => {
    const report = createReport();
    expect(validateReport(report)).toBe(report);
  });

  test('rejects missing, duplicate and negative metrics', () => {
    const missing = createReport();
    missing.sizes.bundles.pop();
    expect(() => validateReport(missing)).toThrow('must contain exactly');

    const duplicate = createReport();
    duplicate.runtime.coldImports[1].id = 'root-esm';
    expect(() => validateReport(duplicate)).toThrow('Duplicate scenario id: root-esm');

    const negative = createReport();
    negative.sizes.package.tarballBytes = -1;
    expect(() => validateReport(negative)).toThrow('tarballBytes');
  });

  test('rejects threshold policy in the foundation phase', () => {
    const report = createReport();
    report.policy = 'blocking';
    expect(() => validateReport(report)).toThrow('report-only');
  });

  test('renders package, bundle, import and throughput sections', () => {
    const summary = renderSummary(createReport());
    expect(summary).toContain('# ua-info Performance & Bundle Size');
    expect(summary).toContain('## Package');
    expect(summary).toContain('## Consumer bundles');
    expect(summary).toContain('## Cold imports');
    expect(summary).toContain('## Parse throughput');
    expect(summary).toContain('Metric movement is informational');
  });
});
