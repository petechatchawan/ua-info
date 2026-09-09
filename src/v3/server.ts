import { decodeClientHints } from './client-hints';
import { enrich } from './enrich';
import { parse } from './parse';
import type { UAInfo } from './types';

export type HeaderValue = string | readonly string[] | undefined;
export type HeaderRecord = Readonly<Record<string, HeaderValue>>;

export interface HeaderGetter {
  get(name: string): string | null;
}

export type HeaderSource = HeaderRecord | HeaderGetter;

export interface RequestLikeInput {
  readonly headers: HeaderSource;
  readonly userAgent?: string;
}

export type ParseRequestInput = HeaderSource | RequestLikeInput;

export function readHeader(headers: HeaderSource, name: string): string | null {
  if (typeof (headers as HeaderGetter).get === 'function') {
    return (headers as HeaderGetter).get(name);
  }

  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers as HeaderRecord)) {
    if (key.toLowerCase() !== target || value === undefined) continue;
    return typeof value === 'string' ? value : value.join(', ');
  }
  return null;
}

function isRequestLikeInput(input: ParseRequestInput): input is RequestLikeInput {
  const headers = (input as RequestLikeInput).headers;
  return headers !== null && typeof headers === 'object' && !Array.isArray(headers);
}

export function parseRequest(input: ParseRequestInput): UAInfo {
  const requestLike = isRequestLikeInput(input) ? input : { headers: input };
  const read = (name: string) => readHeader(requestLike.headers, name);
  const ua = requestLike.userAgent ?? read('user-agent') ?? '';
  return enrich(parse(ua), {
    ua,
    clientHints: decodeClientHints(read),
    runtime: null,
  });
}
