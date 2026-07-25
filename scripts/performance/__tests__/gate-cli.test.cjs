const { execFile } = require('node:child_process');
const { mkdtemp, readFile, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const rootDirectory = path.resolve(__dirname, '../../..');
const cliPath = path.join(rootDirectory, 'scripts', 'performance', 'evaluate-gate.mjs');

function createReport() {
  return {
    schemaVersion: 1,
    policy: 'report-only',
    generatedAt: '2026-07-26T00:00:00.000Z',
    package: { name: 'ua-info', version: '2.2.0' },
    environment: {
      platform: 'linux', arch: 'x64', node: 'v22.23.1', npm: '10.9.8',
      esbuild: '0.25.8', commit: null,
    },
    sizes: {
      package: { tarballBytes: 100, unpackedBytes: 500, fileCount: 10 },
      distributions: [
        { id: 'esm', rawBytes: 200, fileCount: 5 },
        { id: 'cjs', rawBytes: 180, fileCount: 4 },
      ],
      bundles: ['root-parse', 'root-predicate', 'server-parse-request', 'browser-detect-current']
        .map((id, index) => ({
          id,
          platform: id === 'browser-detect-current' ? 'browser' : 'node',
          rawBytes: 1000 + index,
          gzipBytes: 500 + index,
          brotliBytes: 450 + index,
        })),
    },
    runtime: {
      coldImports: ['root-esm', 'root-cjs', 'server-esm', 'browser-esm'].map((id) => ({
        id,
        kind: id === 'root-cjs' ? 'require' : 'import',
        sampleCount: 15,
        medianMilliseconds: 2,
        p95Milliseconds: 3,
        minimumMilliseconds: 1,
        maximumMilliseconds: 4,
      })),
      parseThroughput: ['desktop-chromium', 'mobile-safari', 'line-liff', 'crawler', 'malformed', 'mixed-corpus']
        .map((id) => ({
          id,
          iterations: 20_000,
          sampleCount: 15,
          medianOperationsPerSecond: 100_000,
          p95NanosecondsPerOperation: 12_000,
          checksum: 1,
        })),
    },
  };
}

function createPolicy(baselinePath) {
  return {
    schemaVersion: 1,
    mode: 'static-hard-gate',
    baseline: baselinePath,
    requiredEsbuild: '0.25.8',
    blocking: {
      package: ['unpackedBytes', 'fileCount'],
      distributions: ['rawBytes', 'fileCount'],
      bundles: ['rawBytes'],
    },
    advisory: {
      package: ['tarballBytes'],
      bundles: ['gzipBytes', 'brotliBytes'],
      coldImportSlowdownPercent: 25,
      parseThroughputDropPercent: 15,
    },
  };
}

async function runCli(directory, report, { malformedPolicy = false } = {}) {
  const reportPath = path.join(directory, 'report.json');
  const baselinePath = path.join(directory, 'baseline.json');
  const policyPath = path.join(directory, 'policy.json');
  const outputPath = path.join(directory, 'gate.json');
  const summaryPath = path.join(directory, 'gate.md');

  await writeFile(reportPath, JSON.stringify(report));
  await writeFile(baselinePath, JSON.stringify(createReport()));
  await writeFile(policyPath, malformedPolicy ? '{' : JSON.stringify(createPolicy(baselinePath)));

  try {
    const result = await execFileAsync(process.execPath, [
      cliPath,
      '--report', reportPath,
      '--policy', policyPath,
      '--output', outputPath,
      '--summary', summaryPath,
    ], { cwd: rootDirectory });
    return { ...result, exitCode: 0, outputPath, summaryPath };
  } catch (error) {
    return {
      stdout: error.stdout ?? '', stderr: error.stderr ?? '', exitCode: error.code,
      outputPath, summaryPath,
    };
  }
}

describe('performance gate CLI', () => {
  let directory;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), 'ua-info-gate-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  test('writes PASS output and exits zero', async () => {
    const result = await runCli(directory, createReport());
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(await readFile(result.outputPath, 'utf8')).status).toBe('pass');
    expect(await readFile(result.summaryPath, 'utf8')).toContain('# ua-info Performance Gate: PASS');
  });

  test('writes FAIL output and exits one for static growth', async () => {
    const report = createReport();
    report.sizes.bundles[1].rawBytes += 1;
    const result = await runCli(directory, report);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(await readFile(result.outputPath, 'utf8')).status).toBe('fail');
    expect(await readFile(result.summaryPath, 'utf8')).toContain('PERF_GATE_STATIC_BUDGET_EXCEEDED');
  });

  test('exits zero for warning-only runtime regression', async () => {
    const report = createReport();
    report.runtime.coldImports[0].medianMilliseconds *= 1.2501;
    report.runtime.parseThroughput[0].medianOperationsPerSecond *= 0.8499;
    const result = await runCli(directory, report);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(await readFile(result.outputPath, 'utf8')).warnings).toHaveLength(2);
  });

  test('uses exit code two for invalid arguments and malformed JSON', async () => {
    await expect(execFileAsync(process.execPath, [cliPath], { cwd: rootDirectory }))
      .rejects.toMatchObject({ code: 2 });

    const malformed = await runCli(directory, createReport(), { malformedPolicy: true });
    expect(malformed.exitCode).toBe(2);
    expect(malformed.stderr).toContain('PERF_GATE_IO_ERROR');
  });
});
