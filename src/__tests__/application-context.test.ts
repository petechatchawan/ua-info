import { UAInfo } from '../main/ua-info';

const lineLiffUserAgent =
    'Mozilla/5.0 (Linux; Android 16; 2407FPN8EG Build/BP2A.250605.031.A3; wv) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ' +
    'Chrome/150.0.7871.46 Mobile Safari/537.36 Line/26.11.0 LIFF';

describe('Application and runtime browser detection', () => {
    it('detects LINE LIFF running inside Chrome Webview', () => {
        const parser = new UAInfo().setUserAgent(lineLiffUserAgent);
        const result = parser.getParsedUserAgent();

        expect(result.browser).toMatchObject({
            name: 'Line',
            version: '26.11.0',
            type: 'inapp',
        });

        expect(result.application).toMatchObject({
            name: 'Line',
            version: '26.11.0',
            type: 'inapp',
            context: 'liff',
        });

        expect(result.runtimeBrowser).toMatchObject({
            name: 'Chrome Webview',
            version: '150.0.7871.46',
        });

        expect(result.os).toMatchObject({
            name: 'Android',
            version: '16',
        });

        expect(parser.isApplication('Line')).toBe(true);
        expect(parser.isRuntimeBrowser('Chrome Webview')).toBe(true);
        expect(parser.isRuntimeBrowserVersionAtLeast('150')).toBe(true);
        expect(parser.isRuntimeBrowserVersionAtLeast('151')).toBe(false);
        expect(parser.hasLiffToken()).toBe(true);
        expect(parser.isLiff()).toBe(true);
    });

    it('does not classify a LINE in-app browser as LIFF without the LIFF token', () => {
        const parser = new UAInfo().setUserAgent(lineLiffUserAgent.replace(/ LIFF$/, ''));

        expect(parser.getApplication()).toMatchObject({
            name: 'Line',
            version: '26.11.0',
            context: 'inapp',
        });
        expect(parser.hasLiffToken()).toBe(false);
        expect(parser.isLiff()).toBe(false);
    });

    it('detects a standalone Android Chrome Webview before Chrome Mobile', () => {
        const result = new UAInfo()
            .setUserAgent(
                'Mozilla/5.0 (Linux; Android 16; Pixel 10; wv) ' +
                    'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 ' +
                    'Chrome/150.0.7871.46 Mobile Safari/537.36',
            )
            .getParsedUserAgent();

        expect(result.application).toBeUndefined();
        expect(result.browser).toMatchObject({
            name: 'Chrome Webview',
            version: '150.0.7871.46',
        });
        expect(result.runtimeBrowser).toMatchObject({
            name: 'Chrome Webview',
            version: '150.0.7871.46',
        });
    });

    it('does not classify normal Android Chrome as a Webview', () => {
        const result = new UAInfo()
            .setUserAgent(
                'Mozilla/5.0 (Linux; Android 16; Pixel 10) ' +
                    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                    'Chrome/150.0.7871.46 Mobile Safari/537.36',
            )
            .getParsedUserAgent();

        expect(result.application).toBeUndefined();
        expect(result.runtimeBrowser).toMatchObject({
            name: 'Chrome Mobile',
            version: '150.0.7871.46',
        });
    });

    it('returns stable fallbacks for an unknown user agent', () => {
        const result = new UAInfo().setUserAgent('unknown-client').getParsedUserAgent();

        expect(result.browser).toMatchObject({ name: 'Other', version: '' });
        expect(result.application).toBeUndefined();
        expect(result.runtimeBrowser).toBeUndefined();
        expect(result.os).toMatchObject({ name: 'Other', version: '' });
        expect(result.device).toMatchObject({ type: 'unknown', vendor: '', model: '' });
    });
});
