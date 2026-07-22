import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esmDirectory = path.join(rootDirectory, 'dist', 'esm');
const cjsDirectory = path.join(rootDirectory, 'dist', 'cjs');

function resolveRelativeSpecifier(filePath, specifier) {
  if (!specifier.startsWith('.')) return specifier;
  if (/\.(?:cjs|mjs|js|json|node)$/.test(specifier)) return specifier;

  const absoluteTarget = path.resolve(path.dirname(filePath), specifier);
  if (existsSync(`${absoluteTarget}.js`)) return `${specifier}.js`;
  if (existsSync(path.join(absoluteTarget, 'index.js'))) return `${specifier}/index.js`;

  return specifier;
}

async function rewriteEsmSpecifiers(filePath) {
  let source = await readFile(filePath, 'utf8');

  source = source.replace(
    /\b(from\s+|import\s+)(['"])(\.\.?\/[^'"]+)\2/g,
    (match, prefix, quote, specifier) =>
      `${prefix}${quote}${resolveRelativeSpecifier(filePath, specifier)}${quote}`,
  );

  source = source.replace(
    /import\(\s*(['"])(\.\.?\/[^'"]+)\1\s*\)/g,
    (match, quote, specifier) =>
      `import(${quote}${resolveRelativeSpecifier(filePath, specifier)}${quote})`,
  );

  await writeFile(filePath, source);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(entryPath);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.js') || entry.name.endsWith('.d.ts'))
    ) {
      await rewriteEsmSpecifiers(entryPath);
    }
  }
}

await walk(esmDirectory);
await writeFile(path.join(esmDirectory, 'package.json'), '{\n  "type": "module"\n}\n');
await writeFile(path.join(cjsDirectory, 'package.json'), '{\n  "type": "commonjs"\n}\n');
