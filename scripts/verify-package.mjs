import './verify-package-identity.mjs';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

if (packageJson.name !== 'ua-info') throw new Error(`Expected package name ua-info, received ${packageJson.name}`);
if (packageJson.version !== '3.0.0') throw new Error(`Expected package version 3.0.0, received ${packageJson.version}`);
if (!/^3\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version)) throw new Error(`Expected a valid ua-info 3.x version, received ${packageJson.version}`);
for (const subpath of ['.', './check', './server', './browser']) {
  if (!packageJson.exports?.[subpath]) throw new Error(`The 3.x export map is missing ${subpath}.`);
}
if (packageJson.exports['./v2'] || packageJson.exports['./v2/server'] || packageJson.exports['./v2/browser']) {
  throw new Error('The 3.x export map must not expose transitional /v2 subpaths.');
}

const output = execFileSync(npmCommand, ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' });
const [report] = JSON.parse(output);
if (report.name !== 'ua-info' || report.version !== '3.0.0') throw new Error(`Unexpected packed identity: ${report.name}@${report.version}`);

const packedPaths = report.files.map((file) => file.path);
const leakedPlaygroundFiles = packedPaths.filter((filePath) => filePath.startsWith('apps/playground/'));
if (leakedPlaygroundFiles.length > 0) throw new Error(`Playground files leaked into the root package: ${leakedPlaygroundFiles.join(', ')}`);
const forbiddenFiles = packedPaths.filter((filePath) =>
  filePath.includes('__tests__') ||
  /(?:^|\/).*\.(?:spec|test)\.(?:js|cjs|mjs|ts)$/.test(filePath) ||
  /dist\/(?:esm|cjs)\/(?:main\/ua-info|mappings\/|types\.(?:js|d\.ts)$|utils\.(?:js|d\.ts)$)/.test(filePath),
);
if (forbiddenFiles.length > 0) throw new Error(`Package contains tests or removed v1 artifacts: ${forbiddenFiles.join(', ')}`);
for (const path of ['README.md', 'LICENSE', 'MIGRATION.md']) {
  if (!packedPaths.includes(path)) throw new Error(`Package is missing required documentation: ${path}`);
}
console.log(`Package contents verified: ${report.files.length} files, ua-info@3.0.0, v3 exports present.`);
