import './verify-package-identity.mjs';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const gatePolicy = JSON.parse(await readFile(path.join(root, 'benchmarks', 'performance-gate-policy.json'), 'utf8'));
const budgetBaseline = JSON.parse(await readFile(path.join(root, gatePolicy.baseline), 'utf8'));
// The unpacked size may exceed the reviewed baseline by this much before the release is blocked.
// Bundle sizes are the exact gate (performance:gate); this only catches an accidental large file.
const UNPACKED_SIZE_TOLERANCE = 1.1;
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-info-pack-'));

try {
  if (packageJson.name !== 'user-agent-parser-ts') throw new Error(`Expected package name user-agent-parser-ts, received ${packageJson.name}`);
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version)) {
    throw new Error(`Expected a valid semantic version, received ${packageJson.version}`);
  }
  const subpaths = Object.keys(packageJson.exports ?? {}).filter((subpath) => subpath !== './package.json');
  if (!subpaths.includes('.')) throw new Error('The export map is missing the package root.');
  for (const subpath of subpaths) {
    const entry = packageJson.exports[subpath];
    for (const condition of ['types', 'import', 'require']) {
      const target = entry[condition];
      if (!target) throw new Error(`Export ${subpath} is missing the ${condition} condition.`);
      if (!existsSync(path.join(root, target))) throw new Error(`Export ${subpath} ${condition} target ${target} does not exist. Run npm run build first.`);
    }
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
  const unpackedLimit = Math.ceil(budgetBaseline.sizes.package.unpackedBytes * UNPACKED_SIZE_TOLERANCE);
  if (report.unpackedSize > unpackedLimit) {
    throw new Error(
      `Package unpacked size ${report.unpackedSize} exceeds ${unpackedLimit} bytes (reviewed baseline ${budgetBaseline.sizes.package.unpackedBytes} + 10%). ` +
      'Remove the new files, or review the growth and run npm run budget:update.',
    );
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
