const path = require('node:path');
const { pathToFileURL } = require('node:url');

let reportSchema;
let renderer;

beforeAll(async () => {
  reportSchema = await import(pathToFileURL(path.resolve(__dirname, '../report-schema.mjs')).href);
  renderer = await import(pathToFileURL(path.resolve(__dirname, '../render-summary.mjs')).href);
});

function report() {
  return reportSchema.createExternalConformanceReport({
    generatedAt: '2026-07-26T00:00:00.000Z',
    sourceRevision: 'abc123 (dirty)',
    packageInfo: { name: 'ua-info', version: '2.2.0', commit: 'def456' },
    observations: [
      { domain: 'browser', locator: 'test/data/ua/browser/a.json#0', classification: 'exact', expectedIdentity: 'exact browser' },
      { domain: 'browser', locator: 'test/data/ua/browser/a.json#1', classification: 'unsupported', expectedIdentity: 'missing browser' },
      { domain: 'os', locator: 'test/data/ua/os/a.json#0', classification: 'partial', expectedIdentity: 'example os' },
    ],
  });
}

test('renders deterministic aggregate Markdown with required disclaimer and dirty marker', () => {
  const first = renderer.renderExternalConformanceSummary(report());
  const second = renderer.renderExternalConformanceSummary(report());
  expect(first).toBe(second);
  expect(first).toContain('# ua-info External Conformance Audit');
  expect(first).toContain('`ua-info@2.2.0`');
  expect(first).toContain('`abc123 (dirty)`');
  expect(first).toContain('The external checkout was dirty');
  expect(first).toContain('Interoperability observations are not implementation requirements.');
  expect(first).toContain('| Browser |');
  expect(first).toContain('| OS |');
  expect(first).toContain('| Device |');
  expect(first).toContain('| Total |');
  expect(first).toContain('missing browser');
  expect(first).not.toContain('userAgent');
  expect(first).not.toContain('/absolute/');
});
