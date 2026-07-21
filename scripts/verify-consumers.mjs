import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-info-consumer-'));

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
      `import { BrowserId, parseVersion, satisfiesVersion } from 'ua-info/v2';\n` +
      `assert.equal(typeof UAInfo, 'function');\n` +
      `assert.equal(BrowserId.Chrome, 'chrome');\n` +
      `assert.equal(satisfiesVersion(parseVersion('120.0.1'), '>=120'), true);\n`,
  );

  const cjsConsumer = path.join(workspace, 'consumer.cjs');
  await writeFile(
    cjsConsumer,
    `const assert = require('node:assert/strict');\n` +
      `const { UAInfo } = require('ua-info');\n` +
      `const { BrowserId, parseVersion, satisfiesVersion } = require('ua-info/v2');\n` +
      `assert.equal(typeof UAInfo, 'function');\n` +
      `assert.equal(BrowserId.Chrome, 'chrome');\n` +
      `assert.equal(satisfiesVersion(parseVersion('120.0.1'), '>=120'), true);\n`,
  );

  execFileSync(nodeCommand, [esmConsumer], { cwd: workspace, stdio: 'inherit' });
  execFileSync(nodeCommand, [cjsConsumer], { cwd: workspace, stdio: 'inherit' });

  console.log('Package consumer verification passed for ESM, CommonJS, and ua-info/v2.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
