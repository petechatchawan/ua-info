import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// A release once shipped a build that lacked ids the README advertised, because the tarball was
// packed from an older tree. This check compares the documentation with the build, so that tree
// can never be published again.

/** Ids a two-column table names, plus the ids in the `In-app context` dimension row. */
export function advertisedIds(markdown) {
  const ids = [];
  for (const line of markdown.split('\n')) {
    if (/^\|\s*In-app context\s*\|/i.test(line)) {
      for (const match of line.matchAll(/`([a-z0-9][a-z0-9-]*)`/g)) ids.push(match[1]);
      continue;
    }
    const cells = line.split('|').map((cell) => cell.trim());
    // A row of `| name | id |` splits into an empty cell, two cells and an empty cell.
    if (cells.length !== 4) continue;
    const match = /^`([a-z0-9][a-z0-9-]*)`$/.exec(cells[2]);
    if (match) ids.push(match[1]);
  }
  return ids;
}

/** The advertised ids that no catalog row provides. */
export function missingIds(markdown, known) {
  const have = new Set(known);
  return advertisedIds(markdown).filter((id) => !have.has(id));
}

/** Fails when the README names an id the built catalog does not contain. */
export async function verifyReadmeCatalog(root) {
  const markdown = await readFile(path.join(root, 'README.md'), 'utf8');
  const load = async (file) => import(pathToFileURL(path.join(root, 'dist', 'esm', 'catalog', file)).href);
  const [{ BROWSERS }, { CONTEXTS }] = await Promise.all([load('browsers.js'), load('contexts.js')]);
  const advertised = advertisedIds(markdown);
  const missing = missingIds(markdown, [...Object.keys(BROWSERS), ...Object.keys(CONTEXTS)]);
  if (missing.length > 0) {
    throw new Error(`README names ids that the build does not contain: ${missing.join(', ')}`);
  }
  return advertised.length;
}
