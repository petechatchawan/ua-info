const assert = require('node:assert/strict');
const { BrowserId, parse } = require('ua-info');
const { isBrowser, isChrome, isMobile } = require('ua-info/check');
const { parseRequest } = require('ua-info/server');
const { detect } = require('ua-info/browser');

const ua = 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36';
const result = parse(ua);
assert.equal(result.browser.name, BrowserId.Chrome);
assert.equal(isBrowser(result, BrowserId.Chrome), true);
assert.equal(isChrome(result), true);
assert.equal(isMobile(result), true);
assert.equal(parseRequest({ 'user-agent': ua }).os.name, 'android');
assert.equal(typeof detect, 'function');
assert.throws(() => require('ua-info/v2'), /Package subpath|not defined|cannot find/i);
