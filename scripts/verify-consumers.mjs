import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const typescriptCommand = path.join(rootDirectory, 'node_modules', 'typescript', 'bin', 'tsc');
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-info-consumer-'));
const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

try {
  const packOutput = execFileSync(npmCommand, ['pack', '--ignore-scripts', '--json', '--pack-destination', workspace], {
    cwd: rootDirectory,
    encoding: 'utf8',
  });
  const [packReport] = JSON.parse(packOutput);
  if (packReport.name !== 'ua-info' || packReport.version !== '3.0.0') {
    throw new Error(`Unexpected packed identity: ${packReport.name}@${packReport.version}`);
  }

  const tarballPath = path.join(workspace, packReport.filename);
  await writeFile(path.join(workspace, 'package.json'), '{\n  "private": true,\n  "type": "module"\n}\n');
  execFileSync(npmCommand, ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', tarballPath], {
    cwd: workspace,
    stdio: 'pipe',
  });

  await writeFile(path.join(workspace, 'consumer.mjs'), `
import assert from 'node:assert/strict';
import { BrowserId, parse } from 'ua-info';
import { isBrowser, isChrome, isMobile } from 'ua-info/check';
import { parseRequest } from 'ua-info/server';
import { detect } from 'ua-info/browser';
const result = parse(${JSON.stringify(chromeUA)});
assert.equal(result.browser.name, BrowserId.Chrome);
assert.equal(isBrowser(result, BrowserId.Chrome), true);
assert.equal(isChrome(result), true);
assert.equal(isMobile(result), false);
assert.equal(parseRequest({ 'user-agent': ${JSON.stringify(chromeUA)} }).os.name, 'windows');
assert.equal(typeof detect, 'function');
`);
  await writeFile(path.join(workspace, 'consumer.cjs'), `
const assert = require('node:assert/strict');
const { BrowserId, parse } = require('ua-info');
const { isBrowser, isChrome } = require('ua-info/check');
const { parseRequest } = require('ua-info/server');
const result = parse(${JSON.stringify(chromeUA)});
assert.equal(result.browser.name, BrowserId.Chrome);
assert.equal(isBrowser(result, BrowserId.Chrome), true);
assert.equal(isChrome(result), true);
assert.equal(parseRequest({ 'user-agent': ${JSON.stringify(chromeUA)} }).os.name, 'windows');
`);
  await writeFile(path.join(workspace, 'consumer.ts'), `
import { BrowserId, parse, type UAInfo } from 'ua-info';
import { isBrowser } from 'ua-info/check';
import { parseRequest } from 'ua-info/server';
import { detect } from 'ua-info/browser';
const result: UAInfo = parse(${JSON.stringify(chromeUA)});
if (isBrowser(result, BrowserId.Chrome)) {
  const exact: typeof BrowserId.Chrome = result.browser.name;
  void exact;
}
const requestResult = parseRequest({ 'user-agent': result.ua });
const detector: typeof detect = detect;
void requestResult;
void detector;
`);
  await writeFile(path.join(workspace, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2020', module: 'Node16', moduleResolution: 'Node16', strict: true,
      skipLibCheck: false, noEmit: true, lib: ['ES2020', 'DOM'], types: [],
    },
    include: ['./consumer.ts'],
  }, null, 2));
  await writeFile(path.join(workspace, 'removed-v2-subpath.cjs'), `
const assert = require('node:assert/strict');
assert.throws(() => require('ua-info/v2'), /Package subpath|not defined|cannot find/i);
`);

  execFileSync(nodeCommand, [path.join(workspace, 'consumer.mjs')], { cwd: workspace, stdio: 'inherit' });
  execFileSync(nodeCommand, [path.join(workspace, 'consumer.cjs')], { cwd: workspace, stdio: 'inherit' });
  execFileSync(nodeCommand, [typescriptCommand, '--project', path.join(workspace, 'tsconfig.json')], { cwd: workspace, stdio: 'inherit' });
  execFileSync(nodeCommand, [path.join(workspace, 'removed-v2-subpath.cjs')], { cwd: workspace, stdio: 'inherit' });
  console.log('Package consumer verification passed for v3 root/check/server/browser ESM, CommonJS, and TypeScript APIs.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
