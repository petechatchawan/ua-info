import { execFileSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const targetName = 'user-agent-info';

try {
  const output = execFileSync(
    npmCommand,
    ['view', targetName, 'name', 'version', '--json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );

  console.error(`Target package name is unavailable: ${output.trim() || targetName}`);
  process.exit(1);
} catch (error) {
  if (error?.status === 1) {
    const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;

    if (/E404|404 Not Found/i.test(output)) {
      console.log(`Target package name is available: ${targetName} returned npm E404.`);
      process.exit(0);
    }
  }

  throw error;
}
