import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(rootDirectory, 'apps', 'playground', 'src');
const allowedUaImportOwners = new Set([
  'services/ua-detection-service.ts',
  'contract/public-entrypoints.test.ts',
]);
const allowedUaSpecifiers = new Set([
  'ua-info',
  'ua-info/browser',
  'ua-info/server',
]);
const forbiddenText = [
  ['../../src', 'source-tree import'],
  ['/src/v2/', 'private source path'],
  ['dist/esm', 'private dist path'],
  ['.innerHTML', 'unsafe HTML rendering'],
  ['insertAdjacentHTML', 'unsafe HTML rendering'],
];
const violations = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(absolute);
  }
  return files;
}

for (const absolute of await walk(sourceDirectory)) {
  const relative = path.relative(sourceDirectory, absolute).split(path.sep).join('/');
  const text = await readFile(absolute, 'utf8');
  for (const [needle, label] of forbiddenText) {
    if (text.includes(needle)) violations.push(`${relative}: ${label} (${needle})`);
  }

  const imports = [];
  for (const line of text.split(/\r?\n/)) {
    const fromMatch = line.match(/^\s*(?:import\b.*|}\s*)from\s+['"]([^'"]+)['"]/);
    const sideEffectMatch = line.match(/^\s*import\s+['"]([^'"]+)['"]/);
    if (fromMatch) imports.push(fromMatch[1]);
    else if (sideEffectMatch) imports.push(sideEffectMatch[1]);
  }
  for (const match of text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    imports.push(match[1]);
  }

  for (const target of imports) {
    if (target === 'ua-info' || target.startsWith('ua-info/')) {
      if (!allowedUaSpecifiers.has(target)) {
        violations.push(`${relative}: unsupported ua-info package specifier (${target})`);
      }
      if (!allowedUaImportOwners.has(relative)) {
        violations.push(`${relative}: ua-info import is owned by the detection service`);
      }
    }
  }

  if (!relative.endsWith('.test.ts') && !relative.startsWith('tests/')) {
    for (const target of imports) {
      if (target.endsWith('.test') || target.includes('.test.') || target.includes('/tests/')) {
        violations.push(`${relative}: production import references test code (${target})`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Playground boundary violations:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Playground boundaries verified.');
