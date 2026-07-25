import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  brotliCompressSync,
  constants as zlibConstants,
  gzipSync,
} from 'node:zlib';

const execFileAsync = promisify(execFile);

function sortedNumbers(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Expected a non-empty numeric sample.');
  }
  const sorted = [...values].sort((left, right) => left - right);
  for (const [index, value] of sorted.entries()) {
    assertFiniteNonNegative(value, `sample[${index}]`);
  }
  return sorted;
}

export function median(values) {
  const sorted = sortedNumbers(values);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function percentile(values, percentileValue) {
  if (!Number.isFinite(percentileValue) || percentileValue <= 0 || percentileValue > 100) {
    throw new Error(`Percentile must be within (0, 100], received ${percentileValue}.`);
  }
  const sorted = sortedNumbers(values);
  const rank = Math.max(1, Math.ceil((percentileValue / 100) * sorted.length));
  return sorted[Math.min(sorted.length - 1, rank - 1)];
}

export function assertFiniteNonNegative(value, label) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number, received ${value}.`);
  }
  return value;
}

export function compressedSizes(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return {
    rawBytes: buffer.byteLength,
    gzipBytes: gzipSync(buffer, { level: 9 }).byteLength,
    brotliBytes: brotliCompressSync(buffer, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).byteLength,
  };
}

export async function directoryBytes(directory) {
  let bytes = 0;
  let fileCount = 0;

  async function walk(currentDirectory) {
    const entries = await readdir(currentDirectory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (entry.isFile()) {
        const fileStat = await stat(entryPath);
        bytes += fileStat.size;
        fileCount += 1;
      }
    }
  }

  await walk(directory);
  return { bytes, fileCount };
}

export async function run(command, args = [], options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      maxBuffer: options.maxBuffer ?? 16 * 1024 * 1024,
      encoding: 'utf8',
    });
    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    };
  } catch (error) {
    const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : '';
    const stdout = typeof error?.stdout === 'string' ? error.stdout.trim() : '';
    const detail = [stderr, stdout].filter(Boolean).join('\n');
    throw new Error(
      `Command failed: ${command} ${args.join(' ')}${detail ? `\n${detail}` : ''}`,
      { cause: error },
    );
  }
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
