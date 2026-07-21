import { execFileSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const output = execFileSync(
  npmCommand,
  ['pack', '--dry-run', '--json', '--ignore-scripts'],
  { encoding: 'utf8' },
);

const [report] = JSON.parse(output);
const forbiddenFiles = report.files
  .map((file) => file.path)
  .filter((path) =>
    path.includes('__tests__') ||
    /(?:^|\/).*\.(?:spec|test)\.(?:js|cjs|mjs|ts)$/.test(path),
  );

if (forbiddenFiles.length > 0) {
  console.error('Package contains test files:');
  for (const path of forbiddenFiles) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

console.log(`Package contents verified: ${report.files.length} files, no tests included.`);
