import { parse, type UAInfo } from 'ua-info';
import { detect, type DetectOptions } from 'ua-info/browser';
import type { HeaderRecord } from 'ua-info/server';

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
      const { parseRequest } = await import('ua-info/server');
      return parseRequest(input);
    },
  };
}
