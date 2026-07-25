import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, version as esbuildVersion } from 'esbuild';
import { BUNDLE_SCENARIOS } from '../../benchmarks/scenarios.mjs';
import {
  compressedSizes,
  directoryBytes,
  run,
  writeJson,
} from './lib.mjs';

const modulePath = fileURLToPath(import.meta.url);
const defaultRootDirectory = path.resolve(path.dirname(modulePath), '../..');

function parsePackReport(stdout) {
  const parsed = JSON.parse(stdout);
  const report = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!report || report.name !== 'ua-info') {
    throw new Error(`Unexpected packed package identity: ${report?.name ?? 'missing'}.`);
  }
  if (typeof report.version !== 'string' || report.version.length === 0) {
    throw new Error('Packed package version is missing.');
  }
  for (const [label, value] of [
    ['size', report.size],
    ['unpackedSize', report.unpackedSize],
  ]) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Packed package ${label} is invalid: ${value}.`);
    }
  }
  if (!Array.isArray(report.files)) {
    throw new Error('Packed package files are missing.');
  }
  return report;
}

export function normalizePackReport(report) {
  return {
    name: report.name,
    version: report.version,
    tarballBytes: report.size,
    unpackedBytes: report.unpackedSize,
    fileCount: report.files.length,
  };
}

async function createConsumerProject(rootDirectory, tarballPath, temporaryDirectory) {
  const consumerDirectory = path.join(temporaryDirectory, 'consumer');
  await mkdir(consumerDirectory, { recursive: true });
  await writeFile(
    path.join(consumerDirectory, 'package.json'),
    `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`,
  );
  await run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      tarballPath,
    ],
    { cwd: consumerDirectory },
  );
  return consumerDirectory;
}

async function collectBundles(consumerDirectory) {
  const entriesDirectory = path.join(consumerDirectory, 'entries');
  await mkdir(entriesDirectory, { recursive: true });
  const results = [];

  for (const scenario of BUNDLE_SCENARIOS) {
    const entryPath = path.join(entriesDirectory, `${scenario.id}.mjs`);
    await writeFile(entryPath, scenario.source);
    let output;
    try {
      const result = await build({
        absWorkingDir: consumerDirectory,
        entryPoints: [entryPath],
        bundle: true,
        format: 'esm',
        platform: scenario.platform,
        minify: true,
        treeShaking: true,
        target: 'es2020',
        legalComments: 'none',
        sourcemap: false,
        write: false,
        outfile: `${scenario.id}.js`,
        logLevel: 'silent',
      });
      output = result.outputFiles?.[0]?.contents;
    } catch (error) {
      throw new Error(`Bundle scenario ${scenario.id} failed: ${error.message}`, {
        cause: error,
      });
    }
    if (!output) {
      throw new Error(`Bundle scenario ${scenario.id} produced no output.`);
    }
    results.push({
      id: scenario.id,
      platform: scenario.platform,
      ...compressedSizes(output),
    });
  }

  return results;
}

export async function collectSizes({ rootDirectory = defaultRootDirectory } = {}) {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'ua-info-performance-size-'));
  try {
    const dryRun = parsePackReport(
      (
        await run('npm', ['pack', '--json', '--dry-run', '--ignore-scripts'], {
          cwd: rootDirectory,
        })
      ).stdout,
    );
    const packed = parsePackReport(
      (
        await run(
          'npm',
          [
            'pack',
            '--json',
            '--ignore-scripts',
            '--pack-destination',
            temporaryDirectory,
          ],
          { cwd: rootDirectory },
        )
      ).stdout,
    );

    if (dryRun.name !== packed.name || dryRun.version !== packed.version) {
      throw new Error('Dry-run and generated tarball identities differ.');
    }

    const tarballPath = path.join(temporaryDirectory, packed.filename);
    const consumerDirectory = await createConsumerProject(
      rootDirectory,
      tarballPath,
      temporaryDirectory,
    );
    const [esm, cjs, bundles] = await Promise.all([
      directoryBytes(path.join(rootDirectory, 'dist', 'esm')),
      directoryBytes(path.join(rootDirectory, 'dist', 'cjs')),
      collectBundles(consumerDirectory),
    ]);

    return {
      package: normalizePackReport(packed),
      distributions: [
        { id: 'esm', rawBytes: esm.bytes, fileCount: esm.fileCount },
        { id: 'cjs', rawBytes: cjs.bytes, fileCount: cjs.fileCount },
      ],
      bundles,
      toolchain: {
        esbuild: esbuildVersion,
      },
    };
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

function readOutputArgument(argv) {
  const index = argv.indexOf('--output');
  return index >= 0 ? argv[index + 1] : null;
}

if (process.argv[1] === modulePath) {
  const result = await collectSizes();
  const output = readOutputArgument(process.argv.slice(2));
  if (output) {
    await writeJson(path.resolve(output), result);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
