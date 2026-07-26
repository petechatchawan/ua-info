const { mkdtemp, mkdir, readFile, stat, symlink, writeFile, rm } = require('node:fs/promises');
const { spawnSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createSyntheticExternalSource } = require('./synthetic-source.cjs');

let audit;
let tempRoot;
let worktreeRoot;

beforeAll(async () => {
  audit = await import(pathToFileURL(path.resolve(__dirname, '../audit-external.mjs')).href);
});

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'ua-info-conformance-audit-'));
  worktreeRoot = path.join(tempRoot, 'worktree');
  await mkdir(worktreeRoot);
});

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

function parseSynthetic(userAgent) {
  if (userAgent.includes('IndependentBrowser')) {
    return { browser: { name: 'Independent Browser', version: { raw: '7.4', major: 7, minor: 4 }, mode: 'browser' }, os: { name: 'ExampleOS', version: { raw: '3.2', major: 3, minor: 2 } }, device: { type: 'desktop', vendor: null, model: null }, context: null };
  }
  if (userAgent.includes('ExamplePhone')) return { browser: null, os: null, device: { type: 'mobile', vendor: null, model: 'Q1' }, context: null };
  return { browser: null, os: null, device: { type: 'unknown', vendor: null, model: null }, context: null };
}

function runAudit(sourceRoot, additionalArguments = []) {
  return audit.runExternalConformanceAudit({
    argv: ['--profile', 'ua-parser-js', '--source-dir', sourceRoot, ...additionalArguments],
    worktreeRoot,
    parseUserAgent: parseSynthetic,
    packageInfo: { name: 'ua-info', version: '2.2.0' },
    packageCommit: 'abc123',
    now: () => new Date('2026-07-26T00:00:00.000Z'),
  });
}

test('valid audit writes privacy-safe JSON and Markdown and succeeds with unsupported observations', async () => {
  const { sourceRoot, sentinels } = await createSyntheticExternalSource(tempRoot);
  const browserFile = path.join(sourceRoot, 'test/data/ua/browser/browser-all.json');
  const before = await stat(browserFile);
  const result = await runAudit(sourceRoot);
  const json = await readFile(result.outputPath, 'utf8');
  const markdown = await readFile(result.summaryPath, 'utf8');
  expect(result.report.totals.unsupported).toBeGreaterThan(0);
  expect(JSON.parse(json)).toEqual(result.report);
  for (const sentinel of [...sentinels.userAgents, ...sentinels.descriptions, sourceRoot]) {
    expect(json).not.toContain(sentinel);
    expect(markdown).not.toContain(sentinel);
  }
  const after = await stat(browserFile);
  expect(after.size).toBe(before.size);
  expect(after.mtimeMs).toBe(before.mtimeMs);
});

test('rejects an output directory symlink that resolves into the external source', async () => {
  const { sourceRoot } = await createSyntheticExternalSource(tempRoot);
  const sourceOutputDirectory = path.join(sourceRoot, 'generated');
  const outputLink = path.join(worktreeRoot, 'output-link');
  await mkdir(sourceOutputDirectory);
  await symlink(sourceOutputDirectory, outputLink, 'dir');
  await expect(runAudit(sourceRoot, ['--output', 'output-link/report.json']))
    .rejects.toThrow('CONFORMANCE_OUTPUT_UNSAFE');
  await expect(readFile(path.join(sourceOutputDirectory, 'report.json'), 'utf8'))
    .rejects.toMatchObject({ code: 'ENOENT' });
});

test('rejects an output file symlink that resolves into the external source', async () => {
  const { sourceRoot } = await createSyntheticExternalSource(tempRoot);
  const protectedTarget = path.join(sourceRoot, 'protected.txt');
  const outputDirectory = path.join(worktreeRoot, 'artifacts/conformance');
  const outputLink = path.join(outputDirectory, 'external-conformance.json');
  await writeFile(protectedTarget, 'protected');
  await mkdir(outputDirectory, { recursive: true });
  await symlink(protectedTarget, outputLink, 'file');
  await expect(runAudit(sourceRoot)).rejects.toThrow('CONFORMANCE_OUTPUT_UNSAFE');
  await expect(readFile(protectedTarget, 'utf8')).resolves.toBe('protected');
});

test.each([
  [[], /CONFORMANCE_ARGUMENT_INVALID/],
  [['--profile', 'other', '--source-dir', '/tmp/x'], /CONFORMANCE_ARGUMENT_INVALID/],
  [['--profile', 'ua-parser-js', '--profile', 'ua-parser-js', '--source-dir', '/tmp/x'], /duplicate/],
  [['--unknown', 'x', '--profile', 'ua-parser-js', '--source-dir', '/tmp/x'], /unsupported/],
  [['--profile', 'ua-parser-js', '--source-dir'], /flag\/value pairs/],
])('rejects invalid argument contract %#', (argv, expected) => {
  expect(() => audit.parseAuditArguments(argv)).toThrow(expected);
});

test('malformed source rejects with a stable source error', async () => {
  const { sourceRoot } = await createSyntheticExternalSource(tempRoot);
  await writeFile(path.join(sourceRoot, 'test/data/ua/browser/browser-all.json'), '{');
  await expect(runAudit(sourceRoot)).rejects.toThrow('CONFORMANCE_SOURCE_INVALID');
});

test('direct process invocation without arguments exits 2 before importing the build', () => {
  const script = path.resolve(__dirname, '../audit-external.mjs');
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain('CONFORMANCE_ARGUMENT_INVALID');
});
