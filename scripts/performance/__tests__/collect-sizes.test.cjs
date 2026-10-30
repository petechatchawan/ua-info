describe('static size collection', () => {
  test('normalizes npm pack reports without weakening identity', async () => {
    const { normalizePackReport } = await import('../collect-sizes.mjs');
    expect(
      normalizePackReport({
        name: 'user-agent-parser-ts',
        version: '2.2.0',
        size: 123,
        unpackedSize: 456,
        files: [{ path: 'a' }, { path: 'b' }],
      }),
    ).toEqual({
      name: 'user-agent-parser-ts',
      version: '2.2.0',
      tarballBytes: 123,
      unpackedBytes: 456,
      fileCount: 2,
    });
  });
});
