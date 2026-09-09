import { execFileSync } from 'node:child_process';
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const tarballArgument = process.argv[2];
if (!tarballArgument) throw new Error('verify-consumers.mjs requires a packed tarball path');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturesDirectory = path.join(rootDirectory, 'scripts', 'consumer-fixtures');
const typescriptCommand = path.join(rootDirectory, 'node_modules', 'typescript', 'bin', 'tsc');
const tarballPath = path.resolve(tarballArgument);
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-info-consumer-'));

try {
  await writeFile(path.join(workspace, 'package.json'), '{\n  "private": true,\n  "type": "module"\n}\n');
  for (const file of ['esm.mjs', 'cjs.cjs', 'typescript.ts', 'tsconfig.json']) {
    await copyFile(path.join(fixturesDirectory, file), path.join(workspace, file));
  }

  execFileSync(npmCommand, [
    'install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', tarballPath,
  ], { cwd: workspace, stdio: 'pipe' });

  execFileSync(nodeCommand, [path.join(workspace, 'esm.mjs')], { cwd: workspace, stdio: 'inherit' });
  execFileSync(nodeCommand, [path.join(workspace, 'cjs.cjs')], { cwd: workspace, stdio: 'inherit' });
  execFileSync(nodeCommand, [typescriptCommand, '--project', path.join(workspace, 'tsconfig.json')], {
    cwd: workspace,
    stdio: 'inherit',
  });
  console.log('Package consumer verification passed from the supplied tarball for ESM, CommonJS, and TypeScript APIs.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
