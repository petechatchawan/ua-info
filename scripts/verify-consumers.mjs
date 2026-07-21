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
      `import { UAInfo } from 'ua-info';\n` +
      `import { BrowserId, parse, parseVersion, satisfiesVersion } from 'ua-info/v2';\n` +
      `const result = parse(${JSON.stringify(chromeUA)});\n` +
      `assert.equal(typeof UAInfo, 'function');\n` +
      `assert.equal(result.browser?.id, BrowserId.Chrome);\n` +
      `assert.equal(result.engine?.id, 'blink');\n` +
      `assert.equal(satisfiesVersion(parseVersion('120.0.1'), '>=120'), true);\n`,
  );

  const cjsConsumer = path.join(workspace, 'consumer.cjs');
  await writeFile(
    cjsConsumer,
    `const assert = require('node:assert/strict');\n` +
      `const { UAInfo } = require('ua-info');\n` +
      `const { BrowserId, parse, parseVersion, satisfiesVersion } = require('ua-info/v2');\n` +
      `const result = parse(${JSON.stringify(chromeUA)});\n` +
      `assert.equal(typeof UAInfo, 'function');\n` +
      `assert.equal(result.browser?.id, BrowserId.Chrome);\n` +
      `assert.equal(result.engine?.id, 'blink');\n` +
      `assert.equal(satisfiesVersion(parseVersion('120.0.1'), '>=120'), true);\n`,
  );

  execFileSync(nodeCommand, [esmConsumer], { cwd: workspace, stdio: 'inherit' });
  execFileSync(nodeCommand, [cjsConsumer], { cwd: workspace, stdio: 'inherit' });

  console.log('Package consumer verification passed for ESM, CommonJS, and ua-info/v2.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
