import {
    BrowserFamily,
    BrowserId,
    CPUArchitecture,
    EngineId,
    OSId,
    isBrowser,
    isBrowserFamily,
    isBrowserMode,
    isCPUArchitecture,
    isClientKind,
    isContextKind,
    isDeviceType,
    isEngine,
    isOperatingSystem,
    type UAResult,
} from '../index';

const completeResult: UAResult = {
    ua: 'fixture',
    browser: {
        id: BrowserId.Chrome,
        name: 'Chrome',
        version: {
            raw: '120.0.0.0',
            major: 120,
            minor: 0,
        },
        family: BrowserFamily.Chromium,
        mode: 'webview',
    },
    engine: {
        id: EngineId.Blink,
        name: 'Blink',
        version: null,
    },
    os: {
        id: OSId.Android,
        name: 'Android',
        version: null,
    },
    device: {
        type: 'mobile',
        vendor: 'Google',
        model: 'Pixel',
    },
    cpu: {
        architecture: CPUArchitecture.ARM64,
        bitness: 64,
    },
    client: {
        id: 'googlebot',
        name: 'Googlebot',
        version: null,
        kind: 'crawler',
    },
    context: {
        kind: 'mini-app',
        id: 'liff',
        name: 'LIFF',
        host: null,
    },
};

function assertTypeNarrowing(result: UAResult): void {
    if (isBrowser(result, BrowserId.Chrome)) {
        const value: typeof BrowserId.Chrome = result.browser.id;
        void value;
    }

    if (isBrowserFamily(result, BrowserFamily.Chromium)) {
        const value: typeof BrowserFamily.Chromium = result.browser.family;
        void value;
    }

    if (isBrowserMode(result, 'webview')) {
        const value: 'webview' = result.browser.mode;
        void value;
    }

    if (isEngine(result, EngineId.Blink)) {
        const value: typeof EngineId.Blink = result.engine.id;
        void value;
    }

    if (isOperatingSystem(result, OSId.Android)) {
        const value: typeof OSId.Android = result.os.id;
        void value;
    }

    if (isDeviceType(result, 'mobile')) {
        const value: 'mobile' = result.device.type;
        void value;
    }

    if (isCPUArchitecture(result, CPUArchitecture.ARM64)) {
        const value: typeof CPUArchitecture.ARM64 = result.cpu.architecture;
        void value;
    }

    if (isClientKind(result, 'crawler')) {
        const value: 'crawler' = result.client.kind;
        void value;
    }

    if (isContextKind(result, 'mini-app')) {
        const value: 'mini-app' = result.context.kind;
        void value;
    }

    if (isBrowser(result, 'custom-enterprise-browser')) {
        const value: 'custom-enterprise-browser' = result.browser.id;
        void value;
    }
}

function assertClosedUnionInputs(result: UAResult): void {
    // @ts-expect-error invalid BrowserMode
    isBrowserMode(result, 'Browser');
    // @ts-expect-error invalid DeviceType
    isDeviceType(result, 'phone');
    // @ts-expect-error invalid ClientKind
    isClientKind(result, 'robot');
    // @ts-expect-error invalid ContextKind
    isContextKind(result, 'application');
}

void assertTypeNarrowing;
void assertClosedUnionInputs;

describe('typed predicate helpers', () => {
    it('matches every populated result dimension', () => {
        expect(isBrowser(completeResult, BrowserId.Chrome)).toBe(true);
        expect(isBrowserFamily(completeResult, BrowserFamily.Chromium)).toBe(true);
        expect(isBrowserMode(completeResult, 'webview')).toBe(true);
        expect(isEngine(completeResult, EngineId.Blink)).toBe(true);
        expect(isOperatingSystem(completeResult, OSId.Android)).toBe(true);
        expect(isDeviceType(completeResult, 'mobile')).toBe(true);
        expect(isCPUArchitecture(completeResult, CPUArchitecture.ARM64)).toBe(true);
        expect(isClientKind(completeResult, 'crawler')).toBe(true);
        expect(isContextKind(completeResult, 'mini-app')).toBe(true);
    });

    it('rejects different values for every result dimension', () => {
        expect(isBrowser(completeResult, BrowserId.Firefox)).toBe(false);
        expect(isBrowserFamily(completeResult, BrowserFamily.Firefox)).toBe(false);
        expect(isBrowserMode(completeResult, 'browser')).toBe(false);
        expect(isEngine(completeResult, EngineId.Gecko)).toBe(false);
        expect(isOperatingSystem(completeResult, OSId.Windows)).toBe(false);
        expect(isDeviceType(completeResult, 'desktop')).toBe(false);
        expect(isCPUArchitecture(completeResult, CPUArchitecture.X86_64)).toBe(false);
        expect(isClientKind(completeResult, 'bot')).toBe(false);
        expect(isContextKind(completeResult, 'pwa')).toBe(false);
    });

    it('returns false when nullable dimensions are absent', () => {
        const sparseResult: UAResult = {
            ...completeResult,
            browser: null,
            engine: null,
            os: null,
            cpu: null,
            client: null,
            context: null,
        };

        expect(isBrowser(sparseResult, BrowserId.Chrome)).toBe(false);
        expect(isBrowserFamily(sparseResult, BrowserFamily.Chromium)).toBe(false);
        expect(isBrowserMode(sparseResult, 'webview')).toBe(false);
        expect(isEngine(sparseResult, EngineId.Blink)).toBe(false);
        expect(isOperatingSystem(sparseResult, OSId.Android)).toBe(false);
        expect(isCPUArchitecture(sparseResult, CPUArchitecture.ARM64)).toBe(false);
        expect(isClientKind(sparseResult, 'crawler')).toBe(false);
        expect(isContextKind(sparseResult, 'mini-app')).toBe(false);
    });

    it('uses exact case-sensitive comparisons', () => {
        expect(isBrowser(completeResult, 'Chrome')).toBe(false);
        expect(isBrowserFamily(completeResult, 'Chromium')).toBe(false);
        expect(isEngine(completeResult, 'Blink')).toBe(false);
        expect(isOperatingSystem(completeResult, 'Android')).toBe(false);
        expect(isCPUArchitecture(completeResult, 'ARM64')).toBe(false);
    });

    it('supports custom string identities', () => {
        const customResult: UAResult = {
            ...completeResult,
            browser: {
                ...completeResult.browser!,
                id: 'custom-enterprise-browser',
                family: 'custom-browser-family',
            },
            engine: {
                ...completeResult.engine!,
                id: 'custom-rendering-engine',
            },
            os: {
                ...completeResult.os!,
                id: 'custom-operating-system',
            },
            cpu: {
                ...completeResult.cpu!,
                architecture: 'custom-cpu',
            },
        };

        expect(isBrowser(customResult, 'custom-enterprise-browser')).toBe(true);
        expect(isBrowserFamily(customResult, 'custom-browser-family')).toBe(true);
        expect(isEngine(customResult, 'custom-rendering-engine')).toBe(true);
        expect(isOperatingSystem(customResult, 'custom-operating-system')).toBe(true);
        expect(isCPUArchitecture(customResult, 'custom-cpu')).toBe(true);
    });

    it('does not mutate the supplied result', () => {
        const snapshot = JSON.stringify(completeResult);

        isBrowser(completeResult, BrowserId.Chrome);
        isBrowserFamily(completeResult, BrowserFamily.Chromium);
        isBrowserMode(completeResult, 'webview');
        isEngine(completeResult, EngineId.Blink);
        isOperatingSystem(completeResult, OSId.Android);
        isDeviceType(completeResult, 'mobile');
        isCPUArchitecture(completeResult, CPUArchitecture.ARM64);
        isClientKind(completeResult, 'crawler');
        isContextKind(completeResult, 'mini-app');

        expect(JSON.stringify(completeResult)).toBe(snapshot);
    });
});
