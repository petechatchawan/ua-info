import type { Version } from '../types';
import { readVersion, type Scan } from './scan';

export type Source = 'ua' | 'hints';

const SOURCE_STRENGTH: Readonly<Record<Source, number>> = { ua: 1, hints: 2 };

/** A signal names either a `Name/Version` product or a run of words (`windows nt`, `x86_64`). */
export type Signal<X = unknown> = {
  readonly product?: string;
  readonly words?: string;
  readonly skip?: number;
  readonly valueIs?: readonly string[];
  readonly with?: readonly string[];
  readonly without?: readonly string[];
  readonly os?: readonly string[];
  /** Read the version from this source instead of the token. A missing source fails the signal. */
  readonly versionFrom?: string;
  /** Like `versionFrom`, but a missing source keeps the token's own version instead of failing. */
  readonly versionPrefer?: string;
  readonly versionOptional?: true;
  readonly fallback?: true;
} & X;

export type Match<X = unknown> = string | Signal<X>;

export interface RowSpec<K extends string, X = unknown> {
  readonly match: readonly Match<X>[];
  readonly beats?: readonly K[];
}

export interface Candidate<K extends string, X = unknown> {
  readonly id: K;
  readonly source: Source;
  readonly version: Version | null;
  readonly fallback: boolean;
  readonly signal: Signal<X> | null;
}

export interface Matcher<K extends string, X> {
  find(scanned: Scan, os: string | null): Candidate<K, X>[];
  beats(a: K, b: K): boolean;
  /** Whether a row already names this lowercased token, as a product, a word or a word prefix. */
  accounts(name: string): boolean;
}

function normalize<X>(match: Match<X>): Signal<X> {
  return typeof match === 'string' ? ({ product: match } as Signal<X>) : match;
}


export function compileMatcher<K extends string, X = unknown>(
  rows: Readonly<Record<K, RowSpec<string, X>>>,
): Matcher<K, X> {
  type Entry = { readonly id: K; readonly signal: Signal<X> };
  type PrefixEntry = Entry & { readonly prefix: string };
  const index = new Map<string, Entry[]>();
  const wordIndex = new Map<string, Entry[]>();
  const wordPrefixes: PrefixEntry[] = [];
  const longestKey = new Map<string, number>();
  const beaten = new Map<K, readonly K[]>();

  for (const id of Object.keys(rows) as K[]) {
    for (const match of rows[id].match) {
      const signal = normalize(match);
      const key = (signal.words ?? signal.product ?? '').toLowerCase();
      if (key.length === 0 || (signal.words === undefined) === (signal.product === undefined)) {
        throw new Error(`Row ${id} needs exactly one of product or words.`);
      }
      if (signal.words === undefined) {
        const entries = index.get(key);
        if (entries) entries.push({ id, signal });
        else index.set(key, [{ id, signal }]);
      } else if (key.endsWith('*')) {
        wordPrefixes.push({ id, signal, prefix: key.slice(0, -1) });
      } else {
        const keyWords = key.split(' ');
        longestKey.set(keyWords[0], Math.max(longestKey.get(keyWords[0]) ?? 0, keyWords.length));
        const entries = wordIndex.get(key);
        if (entries) entries.push({ id, signal });
        else wordIndex.set(key, [{ id, signal }]);
      }
    }
    beaten.set(id, (rows[id].beats ?? []) as readonly K[]);
  }

  const beats = (a: K, b: K): boolean => {
    const seen = new Set<K>();
    const stack = [a];
    while (stack.length > 0) {
      const current = stack.pop() as K;
      for (const next of beaten.get(current) ?? []) {
        if (next === b) return true;
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    return false;
  };

  return {
    beats,
    accounts: (name) =>
      index.has(name) ||
      wordIndex.has(name) ||
      wordPrefixes.some((entry) => name.startsWith(entry.prefix)),
    find(scanned, os) {
      const found: Candidate<K, X>[] = [];
      const accept = (id: K, signal: Signal<X>, versionRaw: string | null): void => {
        if (signal.valueIs && !signal.valueIs.some((value) => value.toLowerCase() === versionRaw)) return;
        const present = (name: string): boolean => scanned.names.has(name) || scanned.wordSet.has(name);
        if (signal.with && !signal.with.every((name) => present(name.toLowerCase()))) return;
        if (signal.without && signal.without.some((name) => present(name.toLowerCase()))) return;
        if (signal.os && (os === null || !signal.os.includes(os))) return;
        const from = (signal.versionFrom ?? signal.versionPrefer)?.toLowerCase();
        let source: string | null = null;
        if (from !== undefined) {
          const fromProduct = scanned.products.find((item) => item.name === from);
          const fromPart = scanned.parts.find((part) => part.startsWith(`${from}:`) || part.startsWith(`${from} `));
          source = fromProduct?.version ?? (fromPart === undefined ? null : fromPart.slice(from.length + 1));
        }
        const hasSource = source !== null && source.length > 0;
        const raw = hasSource ? source : signal.versionFrom === undefined ? versionRaw : null;
        const version = readVersion(raw);
        if (version === null && !signal.versionOptional) return;
        found.push({ id, source: 'ua', version, fallback: signal.fallback === true, signal });
      };

      for (const product of index.size === 0 ? [] : scanned.products) {
        for (const { id, signal } of index.get(product.name) ?? []) {
          if (signal.valueIs) {
            if (!signal.valueIs.some((value) => value.toLowerCase() === product.version)) continue;
            accept(id, signal, product.version);
          } else {
            accept(id, signal, product.version);
          }
        }
      }

      const words = longestKey.size === 0 && wordPrefixes.length === 0 ? [] : scanned.words;
      for (let start = 0; start < words.length; start++) {
        const longest = longestKey.get(words[start]);
        if (longest === undefined) continue;
        let key = '';
        for (let length = 1; length <= longest && start + length <= words.length; length++) {
          key = length === 1 ? words[start] : `${key} ${words[start + length - 1]}`;
          for (const { id, signal } of wordIndex.get(key) ?? []) {
            accept(id, signal, words[start + length + (signal.skip ?? 0)] ?? null);
          }
        }
      }

      // A prefix signal matches a word that carries its own version (`musical_ly_34.3.1`), so the
      // digits that follow the prefix are the version and the next word is only the fallback.
      for (let start = 0; start < words.length; start++) {
        const word = words[start];
        for (const { id, signal, prefix } of wordPrefixes) {
          if (!word.startsWith(prefix)) continue;
          const rest = word.slice(prefix.length);
          let digit = 0;
          while (digit < rest.length) {
            const code = rest.charCodeAt(digit);
            if (code >= 48 && code <= 57) break;
            digit++;
          }
          accept(id, signal, digit < rest.length ? rest.slice(digit) : (words[start + 1] ?? null));
        }
      }
      return found;
    },
  };
}

export interface Picked<K extends string, X> {
  readonly id: K | null;
  readonly survivors: readonly Candidate<K, X>[];
}

/**
 * The one precedence rule. Specific candidates beat fallback candidates, a row beats the rows
 * it lists in `beats`, and a stronger source beats a weaker one. Several ids left after that
 * means the evidence conflicts, so no id wins. Row order is never read.
 */
export function pick<K extends string, X>(
  candidates: readonly Candidate<K, X>[],
  beats: (a: K, b: K) => boolean,
): Picked<K, X> {
  const specific = candidates.filter((candidate) => !candidate.fallback);
  const pool = specific.length > 0 ? specific : candidates;
  let survivors = pool.filter(
    (candidate) => !pool.some((other) => other.id !== candidate.id && beats(other.id, candidate.id)),
  );
  if (new Set(survivors.map((candidate) => candidate.id)).size > 1) {
    const strongest = Math.max(...survivors.map((candidate) => SOURCE_STRENGTH[candidate.source]));
    survivors = survivors.filter((candidate) => SOURCE_STRENGTH[candidate.source] === strongest);
  }
  const ids = new Set(survivors.map((candidate) => candidate.id));
  return { id: ids.size === 1 ? survivors[0].id : null, survivors };
}

export function strongestVersion<K extends string, X>(
  candidates: readonly Candidate<K, X>[],
  id: K,
): Version | null {
  const own = candidates
    .filter((candidate) => candidate.id === id && candidate.version !== null)
    .sort((a, b) => SOURCE_STRENGTH[b.source] - SOURCE_STRENGTH[a.source]);
  return own.length > 0 ? own[0].version : null;
}
