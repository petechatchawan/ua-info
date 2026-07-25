import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

function readArgument(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) {
    throw new Error(`Missing required argument ${name}.`);
  }
  return process.argv[index + 1];
}

const kind = readArgument('--kind');
const target = readArgument('--target');
const startedAt = performance.now();

if (kind === 'import') {
  await import(`${pathToFileURL(target).href}?cold=${process.pid}`);
} else if (kind === 'require') {
  createRequire(import.meta.url)(target);
} else {
  throw new Error(`Unsupported import kind: ${kind}.`);
}

const milliseconds = performance.now() - startedAt;
process.stdout.write(`${JSON.stringify({ milliseconds })}\n`);
