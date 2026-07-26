import { execFile as execFileCallback } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { classifyExternalCase } from './classify-result.mjs';
import { readLocalGitState, resolveExternalSource } from './external-source-guard.mjs';
import { loadUaParserJsCases } from './profiles/ua-parser-js-layout.mjs';
import { assertPrivacySafeOutput, createExternalConformanceReport, validateExternalConformanceReport } from './report-schema.mjs';
import { renderExternalConformanceSummary } from './render-summary.mjs';

const execFile = promisify(execFileCallback);
const DEFAULT_OUTPUT = 'artifacts/conformance/external-conformance.json';
const DEFAULT_SUMMARY = 'artifacts/conformance/external-conformance.md';
const ALLOWED = new Set(['--profile', '--source-dir', '--output', '--summary']);

function argumentError(message) { return new Error(`CONFORMANCE_ARGUMENT_INVALID: ${message}`); }
function isWithin(root, candidate) { const relative = path.relative(root, candidate); return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative)); }
function resolveOutputPath(worktreeRoot, value) { return path.isAbsolute(value) ? path.normalize(value) : path.resolve(worktreeRoot, value); }

export function parseAuditArguments(argv) {
  if (!Array.isArray(argv) || argv.length === 0 || argv.length % 2 !== 0) throw argumentError('arguments must be flag/value pairs.');
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index]; const value = argv[index + 1];
    if (!ALLOWED.has(flag)) throw argumentError(`unsupported option ${String(flag)}.`);
    if (values.has(flag)) throw argumentError(`duplicate option ${flag}.`);
    if (typeof value !== 'string' || value.length === 0 || value.startsWith('--')) throw argumentError(`missing value for ${flag}.`);
    values.set(flag, value);
  }
  if (values.get('--profile') !== 'ua-parser-js') throw argumentError('--profile must be ua-parser-js.');
  if (!values.has('--source-dir')) throw argumentError('--source-dir is required.');
  return Object.freeze({ profile: 'ua-parser-js', sourceDir: values.get('--source-dir'), output: values.get('--output') || DEFAULT_OUTPUT, summary: values.get('--summary') || DEFAULT_SUMMARY });
}

export async function runExternalConformanceAudit({ argv, worktreeRoot, parseUserAgent, packageInfo, packageCommit = null, now = () => new Date() }) {
  const args = parseAuditArguments(argv);
  if (typeof parseUserAgent !== 'function') throw new Error('CONFORMANCE_ARGUMENT_INVALID: parseUserAgent must be a function.');
  const { sourceRoot, worktreeRoot: resolvedWorktreeRoot } = await resolveExternalSource({ sourceDir: args.sourceDir, worktreeRoot });
  let cases = await loadUaParserJsCases({ sourceRoot, worktreeRoot: resolvedWorktreeRoot });
  const { revision, dirty } = await readLocalGitState(sourceRoot);
  const sourceRevision = revision === null ? null : dirty === true ? `${revision} (dirty)` : revision;
  const forbiddenSentinels = [sourceRoot, ...cases.map((entry) => entry.userAgent)];
  const observations = [];
  for (const externalCase of cases) {
    let actualResult;
    try { actualResult = await parseUserAgent(externalCase.userAgent); }
    catch (error) { throw new Error(`CONFORMANCE_PARSER_FAILED: unable to parse ${externalCase.locator}.`, { cause: error }); }
    const classified = classifyExternalCase(externalCase, actualResult);
    observations.push(Object.freeze({ domain: externalCase.domain, locator: externalCase.locator, classification: classified.status, expectedIdentity: classified.expectedIdentity }));
  }
  cases = null;
  const timestamp = typeof now === 'function' ? now() : now;
  const generatedAt = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const report = createExternalConformanceReport({ generatedAt, sourceRevision, packageInfo: { name: packageInfo.name, version: packageInfo.version, commit: packageCommit }, observations });
  validateExternalConformanceReport(report);
  assertPrivacySafeOutput(report, forbiddenSentinels);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  assertPrivacySafeOutput(json, forbiddenSentinels);
  const summary = renderExternalConformanceSummary(report);
  assertPrivacySafeOutput(summary, forbiddenSentinels);
  const outputPath = resolveOutputPath(resolvedWorktreeRoot, args.output);
  const summaryPath = resolveOutputPath(resolvedWorktreeRoot, args.summary);
  if (outputPath === summaryPath) throw argumentError('--output and --summary must be different paths.');
  if (isWithin(sourceRoot, outputPath) || isWithin(sourceRoot, summaryPath)) throw new Error('CONFORMANCE_OUTPUT_UNSAFE: output paths must not be inside the external source.');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(outputPath, json, 'utf8');
  await writeFile(summaryPath, summary, 'utf8');
  return Object.freeze({ report, summary, outputPath, summaryPath });
}

async function readPackageCommit(worktreeRoot) {
  try { const { stdout } = await execFile('git', ['-C', worktreeRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }); return stdout.trim() || null; }
  catch { return null; }
}

async function main() {
  const argv = process.argv.slice(2);
  parseAuditArguments(argv);
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const worktreeRoot = path.resolve(scriptDirectory, '../..');
  const packageInfo = JSON.parse(await readFile(path.join(worktreeRoot, 'package.json'), 'utf8'));
  const packageCommit = await readPackageCommit(worktreeRoot);
  const { parse } = await import('../../dist/esm/index.js');
  await runExternalConformanceAudit({ argv, worktreeRoot, parseUserAgent: parse, packageInfo, packageCommit, now: () => new Date() });
}

const invokedDirectly = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  main().then(() => { process.exitCode = 0; }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message.startsWith('CONFORMANCE_') ? message : `CONFORMANCE_AUDIT_FAILED: ${message}`);
    process.exitCode = 2;
  });
}
