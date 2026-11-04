import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../../src/parse';
import { parseRequest } from '../../src/server';
import type { UAInfo } from '../../src/types';

// Real User-Agent strings only. `src` says where each one came from: a live capture (`observed`),
// or a public reference page (`doc`). Nothing composed belongs in these files. Adding a vector
// means adding a row, so the corpus grows without touching this runner.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

interface Vector {
  readonly id: string;
  readonly ua: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly src: string;
  readonly note?: string;
  readonly expect: DeepPartial<Omit<UAInfo, 'ua'>>;
}

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

// `user-agents.json` holds first-party captures. Each subdirectory holds one dimension from the
// public reference pages.
function loadVectors(): Vector[] {
  const files = [path.join(DATA, 'user-agents.json')];
  for (const entry of readdirSync(DATA, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(path.join(DATA, entry.name))) {
      if (file.endsWith('.json')) files.push(path.join(DATA, entry.name, file));
    }
  }
  return files.flatMap((file) => JSON.parse(readFileSync(file, 'utf8')) as Vector[]);
}

const VECTORS = loadVectors();

describe('stored User-Agent vectors', () => {
  it('has an entry', () => {
    expect(VECTORS.length).toBeGreaterThan(0);
  });

  it('uses unique ids', () => {
    const ids = VECTORS.map((entry) => entry.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('cites where every string came from', () => {
    const bad = VECTORS.filter(
      (entry) => !/^(?:observed:\S.*@\d{4}-\d{2}-\d{2}|doc:https?:\/\/\S+)$/.test(entry.src),
    );
    expect(bad.map((entry) => entry.id)).toEqual([]);
  });

  it.each(VECTORS.map((entry) => [entry.id, entry] as const))('%s parses as expected', (_, entry) => {
    const info = entry.headers
      ? parseRequest({ ...entry.headers, 'user-agent': entry.ua })
      : parse(entry.ua);
    expect(info).toMatchObject({ ua: entry.ua, ...entry.expect });
  });
});
