const { mkdtemp, mkdir, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

describe('performance utilities', () => {
  let utilities;

  beforeAll(async () => {
    utilities = await import('../lib.mjs');
  });

  test('calculates median and nearest-rank percentiles deterministically', () => {
    expect(utilities.median([9, 1, 5])).toBe(5);
    expect(utilities.median([7, 1, 5, 3])).toBe(4);
    expect(utilities.percentile([5, 1, 4, 2, 3], 95)).toBe(5);
    expect(utilities.percentile([5, 1, 4, 2, 3], 50)).toBe(3);
  });

  test('rejects invalid metrics', () => {
    expect(() => utilities.assertFiniteNonNegative(-1, 'size')).toThrow('size');
    expect(() => utilities.assertFiniteNonNegative(Number.NaN, 'size')).toThrow('size');
    expect(() => utilities.assertFiniteNonNegative(Number.POSITIVE_INFINITY, 'size')).toThrow('size');
    expect(utilities.assertFiniteNonNegative(0, 'size')).toBe(0);
  });

  test('counts directory bytes in stable lexical order', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'ua-info-perf-lib-'));
    try {
      await mkdir(path.join(directory, 'nested'));
      await writeFile(path.join(directory, 'z.txt'), '12345');
      await writeFile(path.join(directory, 'nested', 'a.txt'), '123');
      await writeFile(path.join(directory, 'a.txt'), '1');

      await expect(utilities.directoryBytes(directory)).resolves.toEqual({
        bytes: 9,
        fileCount: 3,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  test('reports deterministic raw, gzip and Brotli sizes', () => {
    const result = utilities.compressedSizes(Buffer.from('repeat '.repeat(200)));
    expect(result.rawBytes).toBeGreaterThan(0);
    expect(result.gzipBytes).toBeGreaterThan(0);
    expect(result.brotliBytes).toBeGreaterThan(0);
    expect(result.gzipBytes).toBeLessThan(result.rawBytes);
    expect(result.brotliBytes).toBeLessThan(result.rawBytes);
  });
});
