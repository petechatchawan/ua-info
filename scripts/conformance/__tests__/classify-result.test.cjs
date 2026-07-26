const path = require('node:path');
const { pathToFileURL } = require('node:url');

let classifier;
const version = (raw) => ({ raw, major: Number.parseInt(raw, 10), minor: null });
const classify = (domain, expected, actual) => classifier.classifyExternalCase({ domain, expected }, actual);

beforeAll(async () => {
  classifier = await import(pathToFileURL(path.resolve(__dirname, '../classify-result.mjs')).href);
});

test('normalizes generic identity punctuation and unasserted values', () => {
  expect(classifier.normalizeIdentity('  Example/Thing__7  ')).toBe('example thing 7');
  expect(classifier.normalizeIdentity(undefined)).toBeNull();
  expect(classifier.normalizeIdentity('undefined')).toBeNull();
});

test('classifies exact browser product, version, and major', () => {
  expect(classify('browser', { name: 'Example Browser', version: '7_4', major: '7' }, {
    browser: { name: 'Example Browser', version: version('7.4'), mode: 'browser' },
  }).status).toBe('exact');
});

test('classifies unsupported browser derivatives instead of generic Chrome partials', () => {
  expect(classify('browser', { name: 'Distinct Browser', version: '1' }, {
    browser: { name: 'Chrome', version: version('120'), mode: 'browser' },
  }).status).toBe('unsupported');
});

test('classifies an in-app host in context as semantic-equivalent', () => {
  expect(classify('browser', { name: 'Example Host', type: 'inapp', version: '4.2' }, {
    browser: { name: 'Chrome', version: version('120'), mode: 'webview' },
    context: { host: { name: 'Example Host', version: version('4.2') } },
  }).status).toBe('semantic-equivalent');
});

test('classifies browser version mismatch as partial', () => {
  expect(classify('browser', { name: 'Example Browser', version: '8' }, {
    browser: { name: 'Example Browser', version: version('7'), mode: 'browser' },
  }).status).toBe('partial');
});

test('classifies OS exact after underscore-to-dot normalization', () => {
  expect(classify('os', { name: 'Example OS', version: '3_2' }, {
    os: { name: 'Example OS', version: version('3.2') },
  }).status).toBe('exact');
});

test('classifies a specific Linux identity falling back to Linux as partial', () => {
  expect(classify('os', { name: 'Example Linux' }, { os: { name: 'Linux', version: null } }).status).toBe('partial');
});

test('classifies unrelated OS identities as unsupported', () => {
  expect(classify('os', { name: 'Example OS' }, { os: { name: 'Other OS', version: null } }).status).toBe('unsupported');
});

test('classifies device exact, subset partial, type-only partial, and wrong-class unsupported', () => {
  expect(classify('device', { type: 'mobile', vendor: 'Example', model: 'Q1' }, { device: { type: 'mobile', vendor: 'Example', model: 'Q1' } }).status).toBe('exact');
  expect(classify('device', { type: 'mobile', vendor: 'Example', model: 'Q1' }, { device: { type: 'mobile', vendor: null, model: 'Q1' } }).status).toBe('partial');
  expect(classify('device', { type: 'mobile', model: 'Q1' }, { device: { type: 'mobile', vendor: null, model: null } }).status).toBe('partial');
  expect(classify('device', { type: 'tablet' }, { device: { type: 'desktop', vendor: null, model: null } }).status).toBe('unsupported');
});

test('treats absent and literal undefined fields as unasserted', () => {
  const result = classify('device', { type: 'mobile', vendor: 'undefined' }, { device: { type: 'mobile', vendor: null, model: null } });
  expect(result.status).toBe('exact');
  expect(result.mismatchedFields).toEqual([]);
});

test('caps printable expected identity at 120 characters', () => {
  const result = classify('browser', { name: `Example ${'x'.repeat(200)}` }, { browser: null });
  expect(result.expectedIdentity.length).toBeLessThanOrEqual(120);
  expect(result.expectedIdentity).toMatch(/^example/);
});
