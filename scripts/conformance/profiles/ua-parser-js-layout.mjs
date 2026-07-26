import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { assertExternalPath } from '../external-source-guard.mjs';

function invalid(message, cause) {
  return new Error(`CONFORMANCE_SOURCE_INVALID: ${message}`, cause === undefined ? undefined : { cause });
}

function relativeLocator(sourceRoot, filePath) {
  return path.relative(sourceRoot, filePath).split(path.sep).join('/');
}

function toCase(domain, relativeFile, index, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw invalid(`${relativeFile}#${index} must be an object.`);
  }
  if (typeof record.ua !== 'string') {
    throw invalid(`${relativeFile}#${index}.ua must be a string.`);
  }
  if (!record.expect || typeof record.expect !== 'object' || Array.isArray(record.expect)) {
    throw invalid(`${relativeFile}#${index}.expect must be an object.`);
  }
  return Object.freeze({
    domain,
    locator: `${relativeFile}#${index}`,
    userAgent: record.ua,
    expected: Object.freeze({ ...record.expect }),
  });
}

async function readCases({ domain, filePath, sourceRoot, worktreeRoot }) {
  const safeFile = await assertExternalPath({
    candidatePath: filePath,
    worktreeRoot,
    label: `${domain} fixture file`,
  });
  const relativeFile = relativeLocator(sourceRoot, safeFile);
  let parsed;
  try {
    parsed = JSON.parse(await readFile(safeFile, 'utf8'));
  } catch (error) {
    throw invalid(`unable to read valid JSON from ${relativeFile}.`, error);
  }
  if (!Array.isArray(parsed)) {
    throw invalid(`${relativeFile} must contain an array.`);
  }
  return parsed.map((record, index) => toCase(domain, relativeFile, index, record));
}

async function listJsonFiles({ directoryPath, domain, worktreeRoot }) {
  const safeDirectory = await assertExternalPath({
    candidatePath: directoryPath,
    worktreeRoot,
    label: `${domain} fixture directory`,
  });
  let entries;
  try {
    entries = await readdir(safeDirectory, { withFileTypes: true });
  } catch (error) {
    throw invalid(`unable to read ${domain} fixture directory.`, error);
  }
  return entries
    .filter((entry) => (entry.isFile() || entry.isSymbolicLink()) && entry.name.endsWith('.json'))
    .map((entry) => path.join(safeDirectory, entry.name))
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right), 'en'));
}

export async function loadUaParserJsCases({ sourceRoot, worktreeRoot }) {
  const dataRoot = path.join(sourceRoot, 'test', 'data', 'ua');
  const browserDirectory = await assertExternalPath({
    candidatePath: path.join(dataRoot, 'browser'),
    worktreeRoot,
    label: 'browser fixture directory',
  });
  const browserFile = path.join(browserDirectory, 'browser-all.json');
  const osDirectory = path.join(dataRoot, 'os');
  const deviceDirectory = path.join(dataRoot, 'device');

  const cases = [];
  cases.push(...await readCases({
    domain: 'browser',
    filePath: browserFile,
    sourceRoot,
    worktreeRoot,
  }));

  for (const [domain, directoryPath] of [['os', osDirectory], ['device', deviceDirectory]]) {
    const files = await listJsonFiles({ directoryPath, domain, worktreeRoot });
    for (const filePath of files) {
      cases.push(...await readCases({
        domain,
        filePath,
        sourceRoot,
        worktreeRoot,
      }));
    }
  }

  return Object.freeze(cases);
}
