const assert = require('node:assert/strict');
const { parse } = require('ua-inspect');
const { is, isBot } = require('ua-inspect/check');
const { parseRequest } = require('ua-inspect/server');
const { detect } = require('ua-inspect/browser');
const { labels } = require('ua-inspect/labels');

const ua = 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36';
const result = parse(ua);
assert.equal(result.browser.name, 'chrome');
assert.equal(is(result, { browser: 'chrome', os: 'android', device: 'mobile' }), true);
assert.equal(isBot(parse('Googlebot/2.1')), true);
assert.equal(labels.browser.chrome, 'Google Chrome');
assert.equal(parseRequest({ 'user-agent': ua }).os.name, 'android');
assert.equal(typeof detect, 'function');
assert.throws(() => require('ua-inspect/v2'), /Package subpath|not defined|cannot find/i);
assert.throws(() => require('ua-inspect/src/index'), /Package subpath|not defined|cannot find/i);
