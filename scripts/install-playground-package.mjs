import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const playgroundDirectory = path.join(rootDirectory, 'apps', 'playground');
const workspace = await mkdtemp(path.join(os.tmpdir(), 'ua-info-playground-pack-'));

try {
  const expected = JSON.parse(
    await readFile(path.join(rootDirectory, 'package.json'), 'utf8'),
  );
  const output = execFileSync(
    npmCommand,
    ['pack', '--ignore-scripts', '--json', '--pack-destination', workspace],
    { cwd: rootDirectory, encoding: 'utf8' },
  );
  const [report] = JSON.parse(output);
  if (report.name !== expected.name || report.version !== expected.version) {
    throw new Error(
      `Packed identity mismatch: expected ${expected.name}@${expected.version}, ` +
        `received ${report.name}@${report.version}`,
    );
  }

  const tarballPath = path.join(workspace, report.filename);
  execFileSync(
    npmCommand,
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-save',
      '--package-lock=false',
      tarballPath,
    ],
    { cwd: playgroundDirectory, stdio: 'inherit' },
  );

  const installed = JSON.parse(
    await readFile(
      path.join(playgroundDirectory, 'node_modules', 'ua-info', 'package.json'),
      'utf8',
    ),
  );
  if (installed.name !== expected.name || installed.version !== expected.version) {
    throw new Error(
      `Installed identity mismatch: expected ${expected.name}@${expected.version}, ` +
        `received ${installed.name}@${installed.version}`,
    );
  }
  console.log(`Installed packed ${installed.name}@${installed.version}.`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
