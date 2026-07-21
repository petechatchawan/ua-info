import { UAInfo } from '../index';

const IPAD_USER_AGENT =
    'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';

const CHROME_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

describe('UAInfo reliability', () => {
    it('returns a safe initialized result before setUserAgent', () => {
        const result = new UAInfo().getParsedUserAgent();

        expect(result.browser.name).toBe('Other');
        expect(result.browser.version).toBe('');
        expect(result.os.name).toBe('Other');
        expect(result.device).toMatchObject({
            type: 'unknown',
            vendor: '',
            model: '',
        });
    });

    it('returns safe fallbacks for an unknown user agent', () => {
        const result = UAInfo.parse('CustomClient/1.0');

        expect(result.browser.name).toBe('Other');
        expect(result.browser.version).toBe('');
        expect(result.browser.toString()).toBe('Other');
        expect(result.os.name).toBe('Other');
        expect(result.os.toString()).toBe('Other');
        expect(result.device.type).toBe('unknown');
        expect(result.device.toString()).toBe('Unknown');
    });

    it('supports construction with a user-agent string', () => {
        const result = new UAInfo(CHROME_USER_AGENT).getParsedUserAgent();

        expect(result.browser.name).toBe('Chrome');
        expect(result.browser.version).toBe('120.0.0.0');
    });

    it('detects iPad from the parsed user-agent independently of the runtime environment', () => {
        const info = new UAInfo(IPAD_USER_AGENT);

        expect(info.isParsedIPad()).toBe(true);
    });

    it('returns browser environment data safely under Node.js', () => {
        const info = new UAInfo(IPAD_USER_AGENT);

        expect(() => info.getCpuCoreCount()).not.toThrow();
        expect(() => info.getMemory()).not.toThrow();
        expect(info.isCurrentEnvironmentIPad()).toBe(false);
    });

    it('returns false for version comparisons when the current version is unknown', () => {
        const info = new UAInfo('CustomClient/1.0');

        expect(info.isBrowserVersionAtLeast('1.0')).toBe(false);
        expect(info.isRuntimeBrowserVersionAtLeast('1.0')).toBe(false);
        expect(info.isOSVersionAtLeast('1.0')).toBe(false);
    });
});
