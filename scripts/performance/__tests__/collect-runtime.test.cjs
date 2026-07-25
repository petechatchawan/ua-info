describe('runtime measurement summaries', () => {
  let summarizeColdImportSamples;
  let summarizeThroughputSamples;

  beforeAll(async () => {
    ({ summarizeColdImportSamples, summarizeThroughputSamples } = await import(
      '../collect-runtime.mjs'
    ));
  });

  test('summarizes exactly fifteen cold-import samples', () => {
    const samples = Array.from({ length: 15 }, (_, index) => index + 1);
    expect(
      summarizeColdImportSamples({ id: 'root-esm', kind: 'import' }, samples),
    ).toEqual({
      id: 'root-esm',
      kind: 'import',
      sampleCount: 15,
      medianMilliseconds: 8,
      p95Milliseconds: 15,
      minimumMilliseconds: 1,
      maximumMilliseconds: 15,
    });
    expect(() =>
      summarizeColdImportSamples({ id: 'root-esm', kind: 'import' }, samples.slice(1)),
    ).toThrow('requires 15 samples');
  });

  test('summarizes throughput and requires a positive checksum', () => {
    const samples = Array.from({ length: 15 }, (_, index) => ({
      operationsPerSecond: 1000 + index,
      nanosecondsPerOperation: 2000 - index,
      checksum: 2,
    }));
    expect(
      summarizeThroughputSamples(
        { id: 'desktop-chromium', iterations: 20_000 },
        samples,
      ),
    ).toEqual({
      id: 'desktop-chromium',
      iterations: 20_000,
      sampleCount: 15,
      medianOperationsPerSecond: 1007,
      p95NanosecondsPerOperation: 2000,
      checksum: 30,
    });

    expect(() =>
      summarizeThroughputSamples(
        { id: 'desktop-chromium', iterations: 20_000 },
        samples.map((sample) => ({ ...sample, checksum: 0 })),
      ),
    ).toThrow('invalid checksum');
  });
});
