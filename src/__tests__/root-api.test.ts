import * as uaInfo from '../index';

const CHROME_DESKTOP =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36';

describe('ua-info 2.0 package root', () => {
    it('exports the modern pure parser directly', () => {
        const result = uaInfo.parse(CHROME_DESKTOP);

        expect(result.browser?.id).toBe(uaInfo.BrowserId.Chrome);
        expect(result.os?.id).toBe(uaInfo.OSId.Windows);
        expect(result.device.type).toBe('desktop');
    });

    it('does not retain the v1 UAInfo class', () => {
        expect('UAInfo' in uaInfo).toBe(false);
    });
});
