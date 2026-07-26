const path = require('node:path');
const { pathToFileURL } = require('node:url');

let schema;
const baseInput = () => ({
  generatedAt: '2026-07-26T00:00:00.000Z',
  sourceRevision: 'abc123 (dirty)',
  packageInfo: { name: 'ua-info', version: '2.2.0', commit: 'def456' },
  observations: [
    { domain: 'browser', locator: 'test/data/ua/browser/a.json#0', classification: 'exact', expectedIdentity: 'exact browser' },
    { domain: 'browser', locator: 'test/data/ua/browser/a.json#1', classification: 'semantic-equivalent', expectedIdentity: 'host app' },
    { domain: 'browser', locator: 'test/data/ua/browser/a.json#2', classification: 'partial', expectedIdentity: 'partial browser' },
    { domain: 'browser', locator: 'test/data/ua/browser/a.json#3', classification: 'unsupported', expectedIdentity: 'missing browser' },
  ],
});

beforeAll(async () => {
  schema = await import(pathToFileURL(path.resolve(__dirname, '../report-schema.mjs')).href);
});

test('creates the aggregate report contract and excludes exact observations from gaps', () => {
  const report = schema.createExternalConformanceReport(baseInput());
  expect(report).toMatchObject({ schemaVersion: 1, profile: 'ua-parser-js', domains: { browser: { total: 4, exact: 1, semanticEquivalent: 1, partial: 1, unsupported: 1 } }, totals: { total: 4, exact: 1, semanticEquivalent: 1, partial: 1, unsupported: 1 } });
  expect(report.gapGroups).toHaveLength(3);
  expect(report.gapGroups.some((group) => group.classification === 'exact')).toBe(false);
});

test('groups gaps, caps sorted locators, and orders by domain, severity, count, identity', () => {
  const input = baseInput();
  input.observations = [
    ...Array.from({ length: 7 }, (_, index) => ({ domain: 'browser', locator: `test/data/ua/browser/z.json#${6 - index}`, classification: 'unsupported', expectedIdentity: 'zeta' })),
    { domain: 'browser', locator: 'test/data/ua/browser/a.json#0', classification: 'unsupported', expectedIdentity: 'alpha' },
    { domain: 'browser', locator: 'test/data/ua/browser/p.json#0', classification: 'partial', expectedIdentity: 'partial' },
    { domain: 'os', locator: 'test/data/ua/os/a.json#0', classification: 'unsupported', expectedIdentity: 'os gap' },
  ];
  const report = schema.createExternalConformanceReport(input);
  expect(report.gapGroups.map((group) => `${group.domain}:${group.classification}:${group.expectedIdentity}`)).toEqual(['browser:unsupported:zeta', 'browser:unsupported:alpha', 'browser:partial:partial', 'os:unsupported:os gap']);
  expect(report.gapGroups[0].count).toBe(7);
  expect(report.gapGroups[0].locators).toHaveLength(5);
  expect(report.gapGroups[0].locators).toEqual([...report.gapGroups[0].locators].sort());
});

test.each([
  ['unknown key', (report) => { report.extra = true; }],
  ['negative count', (report) => { report.totals.total = -1; }],
  ['unreconciled totals', (report) => { report.totals.total += 1; }],
  ['unreconciled gap groups', (report) => { report.gapGroups[0].count += 1; }],
  ['invalid locator', (report) => { report.gapGroups[0].locators = ['/absolute/path#0']; }],
  ['long identity', (report) => { report.gapGroups[0].expectedIdentity = 'x'.repeat(121); }],
  ['too many locators', (report) => { report.gapGroups[0].locators = Array.from({ length: 6 }, (_, index) => `a.json#${index}`); }],
  ['duplicate locator', (report) => { report.gapGroups[0].count = 2; report.domains.browser.unsupported = 2; report.domains.browser.total = 5; report.totals.unsupported = 2; report.totals.total = 5; report.gapGroups[0].locators = ['a.json#0', 'a.json#0']; }],
  ['non-deterministic gap ordering', (report) => { report.gapGroups.reverse(); }],
])('strict validation rejects %s', (_name, mutate) => {
  const report = structuredClone(schema.createExternalConformanceReport(baseInput()));
  mutate(report);
  expect(() => schema.validateExternalConformanceReport(report)).toThrow('CONFORMANCE_REPORT_INVALID');
});

test.each([
  [{ ua: 'secret' }], [{ userAgent: 'secret' }], [{ expect: {} }], [{ description: 'secret' }], [{ sourceDir: 'secret' }], [{ safe: '/absolute/path' }], [{ safe: 'synthetic-secret' }, ['synthetic-secret']],
])('privacy validation rejects prohibited output %#', (value, sentinels = []) => {
  expect(() => schema.assertPrivacySafeOutput(value, sentinels)).toThrow('CONFORMANCE_PRIVACY_VIOLATION');
});
