import './verify-package-identity.mjs';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-info-pack-'));

try {
  if (packageJson.name !== 'ua-info') throw new Error(`Expected package name ua-info, received ${packageJson.name}`);
  if (!/^3\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version)) {
    throw new Error(`Expected a valid ua-info 3.x version, received ${packageJson.version}`);
  }
  for (const subpath of ['.', './check', './server', './browser']) {
    if (!packageJson.exports?.[subpath]) throw new Error(`The 3.x export map is missing ${subpath}.`);
  }

  const output = execFileSync(npmCommand, [
    'pack', '--ignore-scripts', '--json', '--pack-destination', workspace,
  ], { cwd: root, encoding: 'utf8' });
  const [report] = JSON.parse(output);
  if (report.name !== packageJson.name || report.version !== packageJson.version) {
    throw new Error(`Unexpected packed identity: ${report.name}@${report.version}`);
  }

  const packedPaths = report.files.map((file) => file.path);
  for (const required of ['README.md', 'LICENSE', 'MIGRATION.md']) {
    if (!packedPaths.includes(required)) throw new Error(`Package is missing required documentation: ${required}`);
  }

  const forbiddenFiles = packedPaths.filter((filePath) =>
    filePath.startsWith('apps/playground/') ||
    filePath.includes('__tests__') ||
    /(?:^|\/).*\.(?:spec|test)\.(?:js|cjs|mjs|ts)$/.test(filePath) ||
    /dist\/(?:esm|cjs)\/v2\//.test(filePath) ||
    /dist\/(?:esm|cjs)\/(?:main\/ua-info|mappings\/|types\.(?:js|d\.ts)$|utils\.(?:js|d\.ts)$)/.test(filePath),
  );
  if (forbiddenFiles.length > 0) {
    throw new Error(`Package contains forbidden implementation/test files: ${forbiddenFiles.join(', ')}`);
  }
  if (report.unpackedSize > 150_000) {
    throw new Error(`Package unpacked size exceeds 150000 bytes: ${report.unpackedSize}`);
  }
  if (report.files.length > 64) {
    throw new Error(`Package file count exceeds 64: ${report.files.length}`);
  }

  const tarballPath = path.join(workspace, report.filename);
  execFileSync(nodeCommand, [path.join(root, 'scripts', 'verify-consumers.mjs'), tarballPath], {
    cwd: root,
    stdio: 'inherit',
  });
  console.log(`Package contents verified: ${report.files.length} files, ${report.unpackedSize} unpacked bytes, ${report.name}@${report.version}.`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
