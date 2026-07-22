import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

if (packageJson.version !== '2.0.0') {
  throw new Error(`Expected package version 2.0.0, received ${packageJson.version}`);
}

if (!packageJson.exports?.['.'] || packageJson.exports['./v2'] || packageJson.exports['./v2/server'] || packageJson.exports['./v2/browser']) {
  throw new Error('The 2.0 export map must expose the modern root API without transitional /v2 subpaths.');
}

if (!packageJson.exports['./server'] || !packageJson.exports['./browser']) {
  throw new Error('The 2.0 export map must retain the environment-specific server and browser entry points.');
}

const output = execFileSync(
  npmCommand,
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { encoding: 'utf8' },
);

const [report] = JSON.parse(output);
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

console.log(`Package contents verified: ${report.files.length} files, 2.0 exports only, no tests or v1 artifacts.`);
