import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-info-consumer-'));
const chromeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36';

try {
  const packOutput = execFileSync(
    npmCommand,
    ['pack', '--ignore-scripts', '--json', '--pack-destination', workspace],
    { cwd: rootDirectory, encoding: 'utf8' },
  );
  const [packReport] = JSON.parse(packOutput);
  const tarballPath = path.join(workspace, packReport.filename);

  execFileSync(
    npmCommand,
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', tarballPath],
    { cwd: workspace, stdio: 'pipe' },
  );

  const esmConsumer = path.join(workspace, 'consumer.mjs');
  await writeFile(
    esmConsumer,
    `import assert from 'node:assert/strict';\n` +
      `import * as uaInfo from 'ua-info';\n` +
      `import { parseRequest } from 'ua-info/server';\n` +
      `import { detectCurrent } from 'ua-info/browser';\n` +
      `const { BrowserId, parse, parseVersion, satisfiesVersion } = uaInfo;\n` +
      `const result = parse(${JSON.stringify(chromeUA)});\n` +
      `assert.equal('UAInfo' in uaInfo, false);\n` +
      `assert.equal(result.browser?.id, BrowserId.Chrome);\n` +
      `assert.equal(result.os?.id, 'windows');\n` +
      `assert.equal(result.device.type, 'desktop');\n` +
      `const requestResult = parseRequest({ headers: { 'user-agent': ${JSON.stringify(chromeUA)}, 'sec-ch-ua': '\"Google Chrome\";v=\"121\"' } });\n` +
      `assert.equal(requestResult.browser?.version?.major, 121);\n` +
      `Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: ${JSON.stringify(chromeUA)} } });\n` +
      `Object.defineProperty(globalThis, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });\n` +
      `assert.equal((await detectCurrent()).browser?.id, BrowserId.Chrome);\n` +
      `assert.equal(satisfiesVersion(parseVersion('120.0.1'), '>=120'), true);\n`,
  );

  const cjsConsumer = path.join(workspace, 'consumer.cjs');
  await writeFile(
    cjsConsumer,
    `const assert = require('node:assert/strict');\n` +
      `const uaInfo = require('ua-info');\n` +
      `const { BrowserId, parse } = uaInfo;\n` +
      `const { parseRequest } = require('ua-info/server');\n` +
      `const result = parse(${JSON.stringify(chromeUA)});\n` +
      `assert.equal('UAInfo' in uaInfo, false);\n` +
      `assert.equal(result.browser?.id, BrowserId.Chrome);\n` +
      `assert.equal(parseRequest({ headers: { 'user-agent': ${JSON.stringify(chromeUA)} } }).os?.id, 'windows');\n`,
  );

  const removedV2SubpathConsumer = path.join(workspace, 'removed-v2-subpath.cjs');
  await writeFile(
    removedV2SubpathConsumer,
    `const assert = require('node:assert/strict');\n` +
      `assert.throws(() => require('ua-info/v2'), /Package subpath|not defined|cannot find/i);\n`,
  );

  execFileSync(nodeCommand, [esmConsumer], { cwd: workspace, stdio: 'inherit' });
  execFileSync(nodeCommand, [cjsConsumer], { cwd: workspace, stdio: 'inherit' });
  execFileSync(nodeCommand, [removedV2SubpathConsumer], { cwd: workspace, stdio: 'inherit' });

  console.log('Package consumer verification passed for the 2.0 root, server, browser, ESM, and CommonJS APIs.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
