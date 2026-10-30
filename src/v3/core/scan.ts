import type { Version } from '../types';

export const MAX_UA_LENGTH = 1024;
const MAX_PRODUCTS = 64;
const MAX_PARTS = 64;
const MAX_NAME_LENGTH = 24;
const MAX_VERSION_LENGTH = 32;

const SPACE = 32;
const TAB = 9;
const OPEN_PAREN = 40;
const CLOSE_PAREN = 41;
const OPEN_BRACKET = 91;
const CLOSE_BRACKET = 93;
const SEMICOLON = 59;
const PLUS = 43;
const DOT = 46;
const UNDERSCORE = 95;

export interface Product {
  readonly name: string;
  readonly version: string | null;
  readonly top: boolean;
}

export interface Scan {
  readonly products: readonly Product[];
  readonly parts: readonly string[];
  readonly names: ReadonlySet<string>;
}

function isDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}

function isLetter(code: number): boolean {
  return code >= 97 && code <= 122;
}

function countSpaces(text: string): number {
  let spaces = 0;
  for (let index = 0; index < text.length; index++) {
    if (text.charCodeAt(index) === SPACE) spaces++;
  }
  return spaces;
}

export function readVersion(raw: string | null): Version | null {
  if (raw === null || raw.length === 0 || !isDigit(raw.charCodeAt(0))) return null;
  const limit = Math.min(raw.length, MAX_VERSION_LENGTH);
  let full = '';
  let end = 0;
  while (end < limit) {
    const code = raw.charCodeAt(end);
    if (!isDigit(code) && code !== DOT && code !== UNDERSCORE) break;
    full += code === UNDERSCORE ? '.' : raw[end];
    end++;
  }
  while (full.endsWith('.')) full = full.slice(0, -1);
  let major = 0;
  for (let index = 0; index < full.length && isDigit(full.charCodeAt(index)); index++) {
    major = major * 10 + (full.charCodeAt(index) - 48);
  }
  return { full, major: Number.isSafeInteger(major) ? major : null };
}

/**
 * Splits a User-Agent into `Name/Version` products and the `;` separated parts of every
 * comment group in one pass. It reads each character once and cannot backtrack.
 */
export function scan(input: string): Scan {
  const lower = (input.length > MAX_UA_LENGTH ? input.slice(0, MAX_UA_LENGTH) : input).toLowerCase();
  const length = lower.length;
  const products: Product[] = [];
  const parts: string[] = [];
  const names = new Set<string>();

  const addProduct = (name: string, version: string | null, top: boolean): void => {
    if (products.length >= MAX_PRODUCTS || name.length === 0 || name.length > MAX_NAME_LENGTH) return;
    products.push({ name, version, top });
    names.add(name);
  };

  // `a/b/1.2` is product a with value `b/1.2`, and also product b with version 1.2.
  const addSlashed = (name: string, value: string, top: boolean): void => {
    addProduct(name, value, top);
    const inner = value.indexOf('/');
    if (inner > 0 && isLetter(value.charCodeAt(0))) addProduct(value.slice(0, inner), value.slice(inner + 1), top);
  };

  const addPart = (start: number, end: number): void => {
    const text = lower.slice(start, end).trim();
    if (text.length === 0 || parts.length >= MAX_PARTS) return;
    parts.push(text);
    const slash = text.indexOf('/');
    if (slash <= 0 || slash > MAX_NAME_LENGTH || text.charCodeAt(0) === PLUS) return;
    const name = text.slice(0, slash);
    if (name.indexOf(':') >= 0 || countSpaces(name) > 2) return;
    const space = text.indexOf(' ', slash);
    addSlashed(name, text.slice(slash + 1, space < 0 ? text.length : space), false);
  };

  const addToken = (start: number, end: number): void => {
    const token = lower.slice(start, end);
    const slash = token.indexOf('/');
    const colon = token.indexOf(':');
    if (token.charCodeAt(0) === PLUS || (colon >= 0 && (slash < 0 || colon < slash))) return;
    if (slash > 0) {
      addSlashed(token.slice(0, slash), token.slice(slash + 1), true);
      return;
    }
    let next = end;
    while (next < length && lower.charCodeAt(next) === SPACE) next++;
    let version: string | null = null;
    if (next < length && isDigit(lower.charCodeAt(next))) {
      let stop = next;
      while (stop < length) {
        const code = lower.charCodeAt(stop);
        if (!isDigit(code) && code !== DOT && code !== UNDERSCORE) break;
        stop++;
      }
      const after = stop < length ? lower.charCodeAt(stop) : SPACE;
      if (after === SPACE || after === OPEN_PAREN) version = lower.slice(next, stop);
    }
    addProduct(token, version, true);
  };

  let depth = 0;
  let partStart = 0;
  let index = 0;
  while (index < length) {
    const code = lower.charCodeAt(index);
    if (depth === 0) {
      if (code === SPACE || code === TAB || code === SEMICOLON) {
        index++;
      } else if (code === OPEN_PAREN || code === OPEN_BRACKET) {
        depth = 1;
        partStart = index + 1;
        index++;
      } else {
        let end = index;
        while (end < length) {
          const next = lower.charCodeAt(end);
          if (next === SPACE || next === TAB || next === SEMICOLON || next === OPEN_PAREN || next === OPEN_BRACKET) break;
          end++;
        }
        addToken(index, end);
        index = end;
      }
      continue;
    }
    if (code === OPEN_PAREN || code === OPEN_BRACKET) {
      depth++;
    } else if (code === CLOSE_PAREN || code === CLOSE_BRACKET) {
      depth--;
      if (depth === 0) addPart(partStart, index);
    } else if (code === SEMICOLON && depth === 1) {
      addPart(partStart, index);
      partStart = index + 1;
    }
    index++;
  }
  if (depth > 0) addPart(partStart, length);
  return { products, parts, names };
}
