const { mkdtemp, mkdir, symlink, writeFile, stat, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createSyntheticExternalSource } = require('./synthetic-source.cjs');

let loader;
let tempRoot;
let worktreeRoot;

beforeAll(async () => {
  loader = await import(pathToFileURL(path.resolve(__dirname, '../profiles/ua-parser-js-layout.mjs')).href);
});

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'ua-info-conformance-layout-'));
  worktreeRoot = path.join(tempRoot, 'worktree');
  await mkdir(worktreeRoot);
});

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

test('loads browser first, then sorted OS and device files with deterministic locators', async () => {
  const { sourceRoot } = await createSyntheticExternalSource(tempRoot);
  const cases = await loader.loadUaParserJsCases({ sourceRoot, worktreeRoot });
  expect(cases.map(({ domain, locator }) => `${domain}:${locator}`)).toEqual([
    'browser:test/data/ua/browser/browser-all.json#0',
    'os:test/data/ua/os/alpha.json#0',
    'os:test/data/ua/os/zeta.json#0',
    'device:test/data/ua/device/alpha.json#0',
    'device:test/data/ua/device/zeta.json#0',
  ]);
  expect(cases.every((entry) => !Object.hasOwn(entry, 'desc'))).toBe(true);
  expect(Object.isFrozen(cases)).toBe(true);
  expect(Object.isFrozen(cases[0].expected)).toBe(true);
});

test('does not modify the external source', async () => {
  const { sourceRoot } = await createSyntheticExternalSource(tempRoot);
  const browserFile = path.join(sourceRoot, 'test/data/ua/browser/browser-all.json');
  const before = await stat(browserFile);
  await loader.loadUaParserJsCases({ sourceRoot, worktreeRoot });
  const after = await stat(browserFile);
  expect(after.size).toBe(before.size);
  expect(after.mtimeMs).toBe(before.mtimeMs);
});

test('rejects a symlinked OS directory that resolves inside the worktree', async () => {
  const { sourceRoot } = await createSyntheticExternalSource(tempRoot);
  const insideDirectory = path.join(worktreeRoot, 'os');
  const osDirectory = path.join(sourceRoot, 'test/data/ua/os');
  await rm(osDirectory, { recursive: true });
  await mkdir(insideDirectory);
  await symlink(insideDirectory, osDirectory, 'dir');
  await expect(loader.loadUaParserJsCases({ sourceRoot, worktreeRoot })).rejects.toThrow('CONFORMANCE_SOURCE_UNSAFE');
});

test('rejects a symlinked JSON file that resolves inside the worktree', async () => {
  const { sourceRoot } = await createSyntheticExternalSource(tempRoot);
  const insideFile = path.join(worktreeRoot, 'alpha.json');
  const externalFile = path.join(sourceRoot, 'test/data/ua/os/alpha.json');
  await writeFile(insideFile, '[]');
  await rm(externalFile);
  await symlink(insideFile, externalFile, 'file');
  await expect(loader.loadUaParserJsCases({ sourceRoot, worktreeRoot })).rejects.toThrow('CONFORMANCE_SOURCE_UNSAFE');
});

test.each([
  ['malformed JSON', '{', /valid JSON/],
  ['non-array root', '{}', /must contain an array/],
  ['missing ua', JSON.stringify([{ expect: {} }]), /\.ua must be a string/],
  ['non-object expect', JSON.stringify([{ ua: 'Invented/1', expect: [] }]), /\.expect must be an object/],
])('rejects %s', async (_name, content, expected) => {
  const { sourceRoot } = await createSyntheticExternalSource(tempRoot, { files: { 'test/data/ua/browser/browser-all.json': content } });
  await expect(loader.loadUaParserJsCases({ sourceRoot, worktreeRoot })).rejects.toThrow(expected);
});
