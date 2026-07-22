import './verify-package-identity.mjs';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

if (packageJson.name !== 'ua-info') {
  throw new Error(`Expected package name ua-info, received ${packageJson.name}`);
}

if (packageJson.version !== '2.0.2') {
  throw new Error(`Expected package version 2.0.2, received ${packageJson.version}`);
}

if (!/^2\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version)) {
  throw new Error(`Expected a valid ua-info 2.x version, received ${packageJson.version}`);
}

if (!packageJson.exports?.['.'] || packageJson.exports['./v2'] || packageJson.exports['./v2/server'] || packageJson.exports['./v2/browser']) {
  throw new Error('The 2.x export map must expose the modern root API without transitional /v2 subpaths.');
}

if (!packageJson.exports['./server'] || !packageJson.exports['./browser']) {
  throw new Error('The 2.x export map must retain the environment-specific server and browser entry points.');
}

const output = execFileSync(
  npmCommand,
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { encoding: 'utf8' },
);

const [report] = JSON.parse(output);

if (report.name !== 'ua-info' || report.version !== '2.0.2') {
  throw new Error(`Unexpected packed identity: ${report.name}@${report.version}`);
}

const packedPaths = report.files.map((file) => file.path);
const forbiddenFiles = packedPaths.filter((path) =>
  path.includes('__tests__') ||
  /(?:^|\/).*\.(?:spec|test)\.(?:js|cjs|mjs|ts)$/.test(path) ||
  /dist\/(?:esm|cjs)\/(?:main\/ua-info|mappings\/|types\.(?:js|d\.ts)$|utils\.(?:js|d\.ts)$)/.test(path),
);

if (forbiddenFiles.length > 0) {
  console.error('Package contains tests or removed v1 artifacts:');
  for (const path of forbiddenFiles) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

const requiredDocumentation = ['README.md', 'LICENSE'];
const missingDocumentation = requiredDocumentation.filter((path) => !packedPaths.includes(path));

if (missingDocumentation.length > 0) {
  throw new Error(`Package is missing required documentation: ${missingDocumentation.join(', ')}`);
}

if (packedPaths.includes('MIGRATION.md')) {
  throw new Error('Package must not include the superseded MIGRATION.md document.');
}

console.log(
  `Package contents verified: ${report.files.length} files, ua-info@2.0.2, 2.x exports only, README/LICENSE present, no tests or v1 artifacts.`,
);
