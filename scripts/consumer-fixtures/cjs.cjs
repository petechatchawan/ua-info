const assert = require('node:assert/strict');
const { BrowserId, parse } = require('user-agent-parser-ts');
const { isBrowser, isChrome, isMobile } = require('user-agent-parser-ts/check');
const { parseRequest } = require('user-agent-parser-ts/server');
const { detect } = require('user-agent-parser-ts/browser');

const ua = 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36';
const result = parse(ua);
assert.equal(result.browser.name, BrowserId.Chrome);
assert.equal(isBrowser(result, BrowserId.Chrome), true);
assert.equal(isChrome(result), true);
assert.equal(isMobile(result), true);
assert.equal(parseRequest({ 'user-agent': ua }).os.name, 'android');
assert.equal(typeof detect, 'function');
assert.throws(() => require('user-agent-parser-ts/v2'), /Package subpath|not defined|cannot find/i);
