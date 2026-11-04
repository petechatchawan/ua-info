import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../../src/parse';
import { parseRequest } from '../../src/server';
import type { UAInfo } from '../../src/types';

// Real User-Agent strings, captured from live traffic. Add an entry here when a new string shows
// up; that is the whole workflow. Nothing composed belongs in this file.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

interface UserAgent {
  readonly id: string;
  readonly ua: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly src: string;
  readonly expect: DeepPartial<Omit<UAInfo, 'ua'>>;
}

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'user-agents.json');
const ENTRIES = JSON.parse(readFileSync(FILE, 'utf8')) as readonly UserAgent[];

describe('real User-Agent strings', () => {
  it('has an entry', () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
  });

  it('uses unique ids', () => {
    const ids = ENTRIES.map((entry) => entry.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  it('cites where every string came from', () => {
    const bad = ENTRIES.filter((entry) => !/^(?:observed:\S.*@\d{4}-\d{2}-\d{2}|doc:https?:\/\/\S+)$/.test(entry.src));
    expect(bad.map((entry) => entry.id)).toEqual([]);
  });

  it.each(ENTRIES.map((entry) => [entry.id, entry] as const))('%s parses as expected', (_, entry) => {
    const info = entry.headers
      ? parseRequest({ ...entry.headers, 'user-agent': entry.ua })
      : parse(entry.ua);
    expect(info).toMatchObject({ ua: entry.ua, ...entry.expect });
  });
});
