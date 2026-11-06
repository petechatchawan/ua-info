import { parse, type BrowserId, type UAInfo, type Version } from 'ua-inspect';
import { is, isBot, type Query } from 'ua-inspect/check';
import { detect, type DetectOptions } from 'ua-inspect/browser';
import { parseRequest, type HeaderRecord } from 'ua-inspect/server';
import { labels } from 'ua-inspect/labels';

const result: UAInfo = parse('Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36');
if (is(result, { browser: 'chrome' })) {
    const exact: 'chrome' = result.browser.name;
    void exact;
}
const query: Query = { browser: ['chrome', 'edge'], os: 'android' };
const id: BrowserId = 'samsung-internet';
const label: string = labels.browser[id];
const version: Version | null = result.browser.version;
const minor: number | null | undefined = version?.minor;
// @ts-expect-error a misspelled browser id does not compile
is(result, { browser: 'chrom' });
const headers: HeaderRecord = { 'user-agent': result.ua };
const requestResult: UAInfo = parseRequest(headers);
const options: DetectOptions = { highEntropy: true };
const detector: typeof detect = detect;
void [isBot, query, label, minor, requestResult, options, detector];
