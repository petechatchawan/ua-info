import { parse, type UAInfo } from 'user-agent-parser-ts';
import { detect, type DetectOptions } from 'user-agent-parser-ts/browser';
import type { HeaderRecord } from 'user-agent-parser-ts/server';

export { labels } from 'user-agent-parser-ts/labels';
export type { UAInfo };
export type ClientHintHeaders = HeaderRecord;

export interface UADetectionService {
  detect(): Promise<UAInfo>;
  parseUserAgent(userAgent: string): UAInfo;
  parseRequest(input: {
    readonly userAgent: string;
    readonly headers: ClientHintHeaders;
  }): Promise<UAInfo>;
}

const detectOptions: DetectOptions = { highEntropy: true };

export function createUADetectionService(): UADetectionService {
  return {
    detect: () => detect(detectOptions),
    parseUserAgent: (userAgent) => parse(userAgent),
    async parseRequest(input) {
      const { parseRequest } = await import('user-agent-parser-ts/server');
      return parseRequest(input);
    },
  };
}
