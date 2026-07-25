describe('performance scenario catalog', () => {
  let scenarios;

  beforeAll(async () => {
    scenarios = await import('../../../benchmarks/scenarios.mjs');
  });

  test('locks the representative corpus order', () => {
    expect(scenarios.USER_AGENT_CORPUS.map(({ id }) => id)).toEqual([
      'desktop-chromium',
      'desktop-safari',
      'desktop-firefox',
      'android-chrome',
      'mobile-safari',
      'android-webview',
      'line-liff',
      'electron',
      'oai-searchbot',
      'googlebot-image',
      'malformed',
      'empty',
    ]);
  });

  test('locks bundle, import and throughput scenario IDs', () => {
    expect(scenarios.BUNDLE_SCENARIOS.map(({ id }) => id)).toEqual([
      'root-parse',
      'root-predicate',
      'server-parse-request',
      'browser-detect-current',
    ]);
    expect(scenarios.COLD_IMPORT_SCENARIOS.map(({ id }) => id)).toEqual([
      'root-esm',
      'root-cjs',
      'server-esm',
      'browser-esm',
    ]);
    expect(scenarios.THROUGHPUT_SCENARIOS.map(({ id }) => id)).toEqual([
      'desktop-chromium',
      'mobile-safari',
      'line-liff',
      'crawler',
      'malformed',
      'mixed-corpus',
    ]);
  });

  test('requires unique scenario IDs and positive iterations', () => {
    expect(() => scenarios.assertUniqueScenarioIds([{ id: 'x' }, { id: 'x' }])).toThrow(
      'Duplicate scenario id: x',
    );
    for (const scenario of scenarios.THROUGHPUT_SCENARIOS) {
      expect(Number.isInteger(scenario.iterations)).toBe(true);
      expect(scenario.iterations).toBeGreaterThan(0);
      expect(scenario.userAgents.length).toBeGreaterThan(0);
    }
  });

  test('uses explicit esbuild platforms', () => {
    expect(scenarios.BUNDLE_SCENARIOS.map(({ platform }) => platform)).toEqual([
      'node',
      'node',
      'node',
      'browser',
    ]);
  });
});
