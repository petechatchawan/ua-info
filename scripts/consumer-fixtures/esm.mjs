import assert from 'node:assert/strict';
import { BrowserId, parse } from 'user-agent-parser-ts';
import { isBrowser, isChrome, isMobile } from 'user-agent-parser-ts/check';
import { parseRequest } from 'user-agent-parser-ts/server';
import { detect } from 'user-agent-parser-ts/browser';

const ua = 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36';
const result = parse(ua);
assert.equal(result.browser.name, BrowserId.Chrome);
assert.equal(isBrowser(result, BrowserId.Chrome), true);
assert.equal(isChrome(result), true);
assert.equal(isMobile(result), true);
assert.equal(parseRequest({ 'user-agent': ua }).os.name, 'android');
assert.equal(typeof detect, 'function');
