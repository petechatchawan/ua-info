import { UAInfo } from '../main/ua-info';
const ua = new UAInfo();
function detect(uaString) {
    return ua.setUserAgent(uaString).getParsedUserAgent();
}
function detectBrowser(uaString) {
    return ua.setUserAgent(uaString).getBrowser();
}
describe('Browser Detection', () => {
    // Chrome
    it('detects Chrome desktop', () => {
        const result = detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        expect(result.name).toBe('Chrome');
        expect(result.version).toBe('120.0.0.0');
    });
    it('detects Chrome Mobile (CriOS)', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1');
        expect(result.name).toBe('Chrome Mobile');
    });
    it('detects Chrome Mobile (android)', () => {
        const result = detectBrowser('Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.name).toBe('Chrome Mobile');
    });
    // Safari
    it('detects Safari desktop', () => {
        const result = detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15');
        expect(result.name).toBe('Safari');
    });
    it('detects Safari Mobile', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1');
        expect(result.name).toBe('Safari Mobile');
    });
    // Firefox
    it('detects Firefox desktop', () => {
        const result = detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0');
        expect(result.name).toBe('Firefox');
    });
    it('detects Firefox iOS (FxiOS)', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/121.0 Mobile/15E148 Safari/604.1');
        expect(result.name).toBe('Firefox');
    });
    // Edge
    it('detects Edge desktop', () => {
        const result = detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91');
        expect(result.name).toBe('Edge');
    });
    // Opera
    it('detects Opera desktop (OPR)', () => {
        const result = detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0');
        expect(result.name).toBe('Opera');
    });
    it('detects Opera iOS (OPT)', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPT/6.0 Mobile/15E148 Safari/604.1');
        expect(result.name).toBe('Opera');
    });
    // Opera Mini
    it('detects Opera Mini iOS (OPiOS)', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 16_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPiOS/16.0.15.124050 Mobile/15E148 Safari/9537.53');
        expect(result.name).toBe('Opera Mini');
    });
    it('detects Opera Mini Android (Presto)', () => {
        const result = detectBrowser('Opera/9.80 (Android; Opera Mini/8.0.1807/36.1609; U; en) Presto/2.12.423 Version/12.16');
        expect(result.name).toBe('Opera Mini');
    });
    // Samsung Internet
    it('detects Samsung Internet', () => {
        const result = detectBrowser('Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.name).toBe('Samsung Internet');
    });
    // Brave
    it('detects Brave iOS', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Brave/1 Mobile/15E148 Safari/604.1');
        expect(result.name).toBe('Brave');
    });
    it('detects Brave old desktop (Brave Chrome token)', () => {
        const result = detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Brave Chrome/91.0.4472.124 Safari/537.36');
        expect(result.name).toBe('Brave');
    });
    // Vivaldi
    it('detects Vivaldi desktop', () => {
        const result = detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Vivaldi/7.2.3621.60');
        expect(result.name).toBe('Vivaldi');
    });
    // Yandex
    it('detects Yandex Browser', () => {
        const result = detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 YaBrowser/24.1.0.0');
        expect(result.name).toBe('Yandex');
    });
    // UC Browser
    it('detects UC Browser', () => {
        const result = detectBrowser('Mozilla/5.0 (Linux; U; Android 14; en-US; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.144 UCBrowser/16.0.0.1284 Mobile Safari/537.36');
        expect(result.name).toBe('UC Browser');
    });
    // Arc
    it('detects Arc (best-effort)', () => {
        const result = detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Arc/1.2.3');
        expect(result.name).toBe('Arc');
    });
    // IE
    it('detects IE11 (Trident/rv)', () => {
        const result = detectBrowser('Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko');
        expect(result.name).toBe('IE');
        expect(result.version).toBe('11.0');
    });
    it('detects IE10 (MSIE)', () => {
        const result = detectBrowser('Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)');
        expect(result.name).toBe('IE');
        expect(result.version).toBe('10.0');
    });
    // In-app browsers
    it('detects Facebook in-app', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/456.0.0.0.0;FBBV/0;FBDV/iPhone15,3;FBMD/iPhone;FBSN/iOS;FBSV/17.2;FBSS/3;FBID/phone;FBLC/en;FBOP/5]');
        expect(result.name).toBe('Facebook');
        expect(result.type).toBe('inapp');
    });
    it('detects LINE in-app', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 safari line/13.0.0');
        expect(result.name).toBe('Line');
        expect(result.type).toBe('inapp');
    });
    it('detects LINE LIFF (LINE/ token)', () => {
        const result = detectBrowser('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36 LINE/13.5.0');
        expect(result.name).toBe('Line');
        expect(result.type).toBe('inapp');
    });
    it('detects Instagram in-app', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Instagram/320.0.0.0.000 Mobile/15E148');
        expect(result.name).toBe('Instagram');
        expect(result.type).toBe('inapp');
    });
    it('detects TikTok in-app', () => {
        const result = detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_320.0.0.0.000');
        expect(result.name).toBe('Tiktok');
    });
});
describe('OS Detection', () => {
    it('detects Windows 11', () => {
        const result = detect('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0');
        expect(result.os.name).toBe('Windows');
        expect(result.os.version).toBe('10');
    });
    it('detects macOS Sonoma', () => {
        const result = detect('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15');
        expect(result.os.name).toBe('MacOS');
    });
    it('detects iOS on iPhone', () => {
        const result = detect('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1');
        expect(result.os.name).toBe('iOS');
        expect(result.os.version).toBe('17.2');
    });
    it('detects Android', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.os.name).toBe('Android');
        expect(result.os.version).toBe('14');
    });
    it('detects Chrome OS', () => {
        const result = detect('Mozilla/5.0 (X11; CrOS x86_64 15633.69.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36');
        expect(result.os.name).toBe('Chrome OS');
    });
    it('detects Linux', () => {
        const result = detect('Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0');
        expect(result.os.name).toBe('Linux');
    });
});
describe('Device Detection', () => {
    it('detects iPhone', () => {
        const result = detect('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Apple');
    });
    it('detects iPad', () => {
        const result = detect('Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1');
        expect(result.device.type).toBe('tablet');
        expect(result.device.vendor).toBe('Apple');
    });
    it('detects Mac desktop', () => {
        const result = detect('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        expect(result.device.type).toBe('desktop');
        expect(result.device.vendor).toBe('Apple');
    });
    it('detects Samsung Galaxy mobile', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Samsung');
    });
    it('detects Samsung Galaxy S24 Ultra model', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Samsung');
        expect(result.device.model).toBe('Samsung Galaxy S24 Ultra');
    });
    it('detects Samsung Galaxy Z Fold5 model', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; SM-F946B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.vendor).toBe('Samsung');
        expect(result.device.model).toBe('Samsung Galaxy Z Fold5');
    });
    it('detects Samsung Galaxy A55 model', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; SM-A556B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.vendor).toBe('Samsung');
        expect(result.device.model).toBe('Samsung Galaxy A55');
    });
    it('detects Vivo X100 Pro', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; V2324A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('vivo');
    });
    it('detects Vivo iQOO 12', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; V2307A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('vivo');
    });
    it('detects Vivo Y20', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 10; V2027) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('vivo');
    });
    it('detects Oppo Find X8 Pro', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; CPH2653) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Oppo');
    });
    it('detects Oppo Reno12 Pro', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; CPH2629) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Oppo');
    });
    it('detects Huawei Pura 70 Ultra', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; HBP-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Huawei');
    });
    it('detects Huawei Mate 60 Pro', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; ALN-AL00) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Huawei');
    });
    it('detects Huawei P60 Pro', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; MNA-LX9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Huawei');
    });
    it('detects Realme GT 7 Pro', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; RMX5100) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Realme');
    });
    it('detects Realme 13 Pro+', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; RMX3920) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Realme');
    });
    it('detects Xiaomi 14 Pro', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; Xiaomi 14 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Xiaomi');
    });
    it('detects Xiaomi Redmi Note 13 Pro+', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; Redmi Note 13 Pro+) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Xiaomi');
    });
    it('detects POCO F6', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; 24069PC21G; POCO F6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Xiaomi');
    });
    it('detects Asus ROG Phone 8', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; ASUS_AI2401) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Asus');
    });
    it('detects Asus ZenFone 10', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; ASUS_AI2302) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('Asus');
    });
    it('detects OnePlus 13', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; CPH2653; OnePlus 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('OnePlus');
    });
    it('detects OnePlus 12', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; CPH2581; OnePlus 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('OnePlus');
    });
    it('detects OnePlus Pad 2', () => {
        const result = detect('Mozilla/5.0 (Linux; Android 14; OPD2403) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Safari/537.36');
        expect(result.device.type).toBe('mobile');
        expect(result.device.vendor).toBe('OnePlus');
    });
});
