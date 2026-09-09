import { BrowserId, parse, type UAInfo } from 'ua-info';
import { isBrowser, isChrome } from 'ua-info/check';
import { detect, type DetectOptions } from 'ua-info/browser';
import { parseRequest, type HeaderRecord } from 'ua-info/server';

const result: UAInfo = parse('Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36');
if (isBrowser(result, BrowserId.Chrome)) {
  const exact: typeof BrowserId.Chrome = result.browser.name;
  void exact;
}
const headers: HeaderRecord = { 'user-agent': result.ua };
const requestResult: UAInfo = parseRequest(headers);
const options: DetectOptions = { highEntropy: true };
const detector: typeof detect = detect;
void isChrome;
void requestResult;
void options;
void detector;
