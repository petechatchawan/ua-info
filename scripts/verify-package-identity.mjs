import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

const expected = Object.freeze({
  name: 'ua-info',
  version: '2.1.0',
  repository: 'git+https://github.com/petechatchawan/ua-info.git',
  homepage: 'https://petechatchawan.github.io/ua-info/',
  bugs: 'https://github.com/petechatchawan/ua-info/issues',
});

const failures = [];

if (packageJson.name !== expected.name) failures.push(`name: ${packageJson.name}`);
if (packageJson.version !== expected.version) failures.push(`version: ${packageJson.version}`);
if (packageJson.repository?.url !== expected.repository) failures.push(`repository: ${packageJson.repository?.url}`);
if (packageJson.homepage !== expected.homepage) failures.push(`homepage: ${packageJson.homepage}`);
if (packageJson.bugs?.url !== expected.bugs) failures.push(`bugs: ${packageJson.bugs?.url}`);

const requiredFiles = new Set(['dist', 'README.md', 'LICENSE']);
for (const entry of requiredFiles) {
  if (!packageJson.files?.includes(entry)) failures.push(`files is missing ${entry}`);
}
if (packageJson.files?.includes('MIGRATION.md')) failures.push('files must not include MIGRATION.md');

const publishWorkflow = await readFile(path.join(root, '.github/workflows/publish.yml'), 'utf8');
const requiredWorkflowFragments = [
  'id-token: write',
  'expected_repository="petechatchawan/ua-info"',
  'if [ "$package_name" != "ua-info" ]; then',
  'needs: release-context',
  "if: needs.release-context.outputs.can-publish == 'true'",
];
for (const fragment of requiredWorkflowFragments) {
  if (!publishWorkflow.includes(fragment)) failures.push(`publish workflow is missing: ${fragment}`);
}

const forbiddenWorkflowFragments = [
  'NODE_AUTH_TOKEN',
  'secrets.NPM_TOKEN',
  'temporary NPM_TOKEN fallback',
];
for (const fragment of forbiddenWorkflowFragments) {
  if (publishWorkflow.includes(fragment)) failures.push(`publish workflow must be OIDC-only and remove: ${fragment}`);
}

const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const allowedHistoricalFiles = new Set([
  'docs/superpowers/specs/2026-07-22-user-agent-info-package-migration-design.md',
  'docs/superpowers/plans/2026-07-22-user-agent-info-package-migration.md',
  'docs/superpowers/specs/2026-07-22-ua-info-identity-restoration-design.md',
  'docs/superpowers/plans/2026-07-22-ua-info-identity-restoration.md',
]);
const forbiddenPatterns = [
  /from ['"]user-agent-info(?:\/[^'"]*)?['"]/g,
  /require\(['"]user-agent-info(?:\/[^'"]*)?['"]\)/g,
  /(?:npm install|npm i|pnpm add|yarn add) user-agent-info(?:\s|$)/g,
  /github\.com\/petechatchawan\/user-agent-info/g,
  /npmjs\.com\/package\/user-agent-info/g,
  /shields\.io\/npm\/(?:v|l)\/user-agent-info/g,
];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(absolute));
    else if (/\.(?:md|mjs|js|ts|json|yml|yaml)$/.test(entry.name)) files.push(absolute);
  }

  return files;
}

for (const absolute of await collect(root)) {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  if (allowedHistoricalFiles.has(relative)) continue;
  const content = await readFile(absolute, 'utf8');

  for (const pattern of forbiddenPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) failures.push(`${relative}: stale superseded reference matched ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error('Package identity verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Package identity verified: ua-info@2.1.0, canonical metadata, and OIDC-only release workflow.');
