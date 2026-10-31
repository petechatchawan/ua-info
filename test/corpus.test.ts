import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../src/parse';
import { parseRequest } from '../src/server';
import type { UAInfo } from '../src/types';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

interface CorpusEntry {
  readonly id: string;
  readonly ua: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly src: string;
  readonly defect?: string;
  readonly open?: true;
  readonly expect: DeepPartial<Omit<UAInfo, 'ua'>>;
}

const CORPUS_DIRECTORY = path.join(path.dirname(fileURLToPath(import.meta.url)), 'corpus');
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_PATTERN = /^(?:doc:https?:\/\/\S+|observed:\S.*@\d{4}-\d{2}-\d{2}|synthetic:\S.*)$/;
const DEFECT_PATTERN = /^#\d+$/;

function loadCorpus(): readonly (CorpusEntry & { readonly file: string })[] {
  return readdirSync(CORPUS_DIRECTORY)
    .filter((name) => name.endsWith('.jsonl'))
    .sort()
    .flatMap((file) =>
      readFileSync(path.join(CORPUS_DIRECTORY, file), 'utf8')
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line, index) => {
          try {
            return { ...(JSON.parse(line) as CorpusEntry), file };
          } catch (error) {
            throw new Error(`${file}:${index + 1} is not valid JSON: ${(error as Error).message}`);
          }
        }),
    );
}

function run(entry: CorpusEntry): UAInfo {
  return entry.headers
    ? parseRequest({ ...entry.headers, 'user-agent': entry.ua })
    : parse(entry.ua);
}

const corpus = loadCorpus();

describe('corpus format', () => {
  it('is not empty', () => {
    expect(corpus.length).toBeGreaterThan(0);
  });

  it('uses unique ids across every file', () => {
    const ids = corpus.map((entry) => entry.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it.each(corpus.map((entry) => [`${entry.file}: ${entry.id}`, entry] as const))('%s is well formed', (_, entry) => {
    expect(entry.id).toMatch(ID_PATTERN);
    expect(typeof entry.ua).toBe('string');
    expect(entry.src, 'src must be doc:<url>, observed:<where>@<yyyy-mm-dd>, or synthetic:<why>').toMatch(SOURCE_PATTERN);
    expect(Object.keys(entry.expect).length).toBeGreaterThan(0);
    if (entry.defect !== undefined) expect(entry.defect).toMatch(DEFECT_PATTERN);
    if (entry.open) expect(entry.defect, 'an open entry must name the defect it pins').toBeDefined();
    if (entry.headers) {
      expect(Object.keys(entry.headers).filter((name) => name !== name.toLowerCase())).toEqual([]);
    }
  });
});

describe('corpus results', () => {
  for (const entry of corpus) {
    const name = `${entry.file}: ${entry.id}`;
    // An open entry records the desired result of a known defect. `it.fails` turns the day the
    // defect is fixed into a failure, so the fixing change must remove `open` from the entry.
    const define = entry.open ? it.fails : it;
    define(entry.open ? `${name} (open ${entry.defect})` : name, () => {
      expect(run(entry)).toMatchObject({ ua: entry.ua, ...entry.expect });
    });
  }
});
