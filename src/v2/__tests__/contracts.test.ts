import { BrowserId, CPUArchitecture, type UAResult } from '../index';

type IfEquals<X, Y, Equal = true, NotEqual = false> = (<T>() => T extends X ? 1 : 2) extends <T>() =>
    T extends Y ? 1 : 2
    ? Equal
    : NotEqual;

type ReadonlyKeys<T> = {
    [Key in keyof T]-?: IfEquals<
        { [Property in Key]: T[Property] },
        { -readonly [Property in Key]: T[Property] },
        never,
        Key
    >;
}[keyof T];

type AllPropertiesReadonly<T> = keyof T extends ReadonlyKeys<T> ? true : false;
type Assert<T extends true> = T;
type UAResultReadonlyContract = Assert<AllPropertiesReadonly<UAResult>>;

const uaResultReadonlyContract: UAResultReadonlyContract = true;

const chromeResult: UAResult = {
    ua: 'Mozilla/5.0 Chrome/120.0.0.0',
    browser: {
        id: BrowserId.Chrome,
        name: 'Chrome',
        version: {
            raw: '120.0.0.0',
            major: 120,
            minor: 0,
        },
        family: 'chromium',
        mode: 'browser',
    },
    engine: {
        id: 'blink',
        name: 'Blink',
        version: null,
    },
    os: null,
    device: {
        type: 'desktop',
        vendor: null,
        model: null,
    },
    cpu: {
        architecture: CPUArchitecture.X86_64,
        bitness: 64,
    },
    client: null,
    context: null,
};

describe('v2 public contracts', () => {
    it('represents an ordinary browser without duplicating it as a client', () => {
        expect(chromeResult.browser?.id).toBe(BrowserId.Chrome);
        expect(chromeResult.client).toBeNull();
        expect(chromeResult.context).toBeNull();
    });

    it('supports hostless execution contexts such as PWA', () => {
        const pwaResult: UAResult = {
            ...chromeResult,
            context: {
                kind: 'pwa',
                id: 'standalone',
                name: 'Standalone PWA',
                host: null,
            },
        };

        expect(pwaResult.context?.host).toBeNull();
    });

    it('keeps every result field readonly at the type level', () => {
        expect(uaResultReadonlyContract).toBe(true);
    });
});
