import { parse } from './parse';
import { enrichWithClientHints, readHeader, type HeaderSource } from './parser/client-hints';
import type { UAResult } from './types';

export interface ParseRequestInput {
    readonly headers: HeaderSource;
    readonly userAgent?: string;
}

/** Parses a server request using User-Agent and available request Client Hints. */
export function parseRequest(input: ParseRequestInput): UAResult {
    const userAgent = input.userAgent ?? readHeader(input.headers, 'user-agent') ?? '';
    return enrichWithClientHints(parse(userAgent), input.headers);
}

export type { HeaderGetter, HeaderRecord, HeaderSource, HeaderValue } from './parser/client-hints';
