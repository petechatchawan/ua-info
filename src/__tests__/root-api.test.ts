import * as userAgentInfo from '../index';

const CHROME_DESKTOP =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36';

describe('ua-info 2.0 package root', () => {
    it('exports the modern pure parser directly', () => {
        const result = userAgentInfo.parse(CHROME_DESKTOP);

        expect(result.browser?.id).toBe(userAgentInfo.BrowserId.Chrome);
        expect(result.os?.id).toBe(userAgentInfo.OSId.Windows);
        expect(result.device.type).toBe('desktop');
    });

    it('exports the typed predicate helpers', () => {
        expect(typeof userAgentInfo.isBrowser).toBe('function');
        expect(typeof userAgentInfo.isBrowserFamily).toBe('function');
        expect(typeof userAgentInfo.isBrowserMode).toBe('function');
        expect(typeof userAgentInfo.isEngine).toBe('function');
        expect(typeof userAgentInfo.isOperatingSystem).toBe('function');
        expect(typeof userAgentInfo.isDeviceType).toBe('function');
        expect(typeof userAgentInfo.isCPUArchitecture).toBe('function');
        expect(typeof userAgentInfo.isClientKind).toBe('function');
        expect(typeof userAgentInfo.isContextKind).toBe('function');
    });

    it('does not retain the v1 UAInfo class', () => {
        expect('UAInfo' in userAgentInfo).toBe(false);
    });
});
