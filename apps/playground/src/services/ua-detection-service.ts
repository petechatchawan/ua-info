import { parse, type UAResult } from 'ua-info';
import { detectCurrent, type DetectCurrentOptions } from 'ua-info/browser';
import type { HeaderRecord } from 'ua-info/server';

export type { UAResult };
export type ClientHintHeaders = HeaderRecord;

export interface UADetectionService {
  detectCurrent(): Promise<UAResult>;
  parseUserAgent(userAgent: string): UAResult;
  parseRequest(input: {
    readonly userAgent: string;
    readonly headers: ClientHintHeaders;
  }): Promise<UAResult>;
}

const highEntropy: NonNullable<DetectCurrentOptions['highEntropy']> = [
  'architecture',
  'bitness',
  'fullVersionList',
  'model',
  'platformVersion',
];

export function createUADetectionService(): UADetectionService {
  return {
    detectCurrent: () => detectCurrent({ highEntropy }),
    parseUserAgent: (userAgent) => parse(userAgent),
    async parseRequest(input) {
      const { parseRequest } = await import('ua-info/server');
      return parseRequest(input);
    },
  };
}
