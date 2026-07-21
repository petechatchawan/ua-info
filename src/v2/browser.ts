import { parse } from './parse';
import { enrichWithClientHints, type HeaderRecord } from './parser/client-hints';
import type { UAResult } from './types';

interface UserAgentBrandVersion {
    readonly brand: string;
    readonly version: string;
}

interface UserAgentDataValues {
    readonly architecture?: string;
    readonly bitness?: string;
    readonly fullVersionList?: readonly UserAgentBrandVersion[];
    readonly model?: string;
    readonly platformVersion?: string;
}

interface UserAgentDataLike {
    readonly brands: readonly UserAgentBrandVersion[];
    readonly mobile: boolean;
    readonly platform: string;
    getHighEntropyValues?(hints: readonly string[]): Promise<UserAgentDataValues>;
}

interface NavigatorWithUAData extends Navigator {
    readonly standalone?: boolean;
    readonly userAgentData?: UserAgentDataLike;
}

export interface DetectCurrentOptions {
    readonly highEntropy?: readonly ('architecture' | 'bitness' | 'fullVersionList' | 'model' | 'platformVersion')[];
}

function serializeBrands(brands: readonly UserAgentBrandVersion[]): string {
    return brands.map((item) => `"${item.brand}";v="${item.version}"`).join(', ');
}

function isStandalonePWA(navigatorValue: NavigatorWithUAData): boolean {
    if (navigatorValue.standalone === true) return true;
    return typeof globalThis.matchMedia === 'function' && globalThis.matchMedia('(display-mode: standalone)').matches;
}

/** Detects the current browser using UA, Client Hints, and runtime-only signals. */
export async function detectCurrent(options: DetectCurrentOptions = {}): Promise<UAResult> {
    if (typeof globalThis.navigator === 'undefined') {
        throw new Error('detectCurrent() requires a browser-like navigator. Use parse() or parseRequest() on the server.');
    }

    const navigatorValue = globalThis.navigator as NavigatorWithUAData;
    let result = parse(navigatorValue.userAgent ?? '');
    const data = navigatorValue.userAgentData;

    if (data) {
        const headers: Record<string, string> = {
            'sec-ch-ua': serializeBrands(data.brands),
            'sec-ch-ua-mobile': data.mobile ? '?1' : '?0',
            'sec-ch-ua-platform': `"${data.platform}"`,
        };
        const requested = options.highEntropy ?? [
            'architecture',
            'bitness',
            'fullVersionList',
            'model',
            'platformVersion',
        ];
        if (data.getHighEntropyValues && requested.length > 0) {
            const values = await data.getHighEntropyValues(requested);
            if (values.fullVersionList) headers['sec-ch-ua-full-version-list'] = serializeBrands(values.fullVersionList);
            if (values.architecture) headers['sec-ch-ua-arch'] = `"${values.architecture}"`;
            if (values.bitness) headers['sec-ch-ua-bitness'] = `"${values.bitness}"`;
            if (values.model) headers['sec-ch-ua-model'] = `"${values.model}"`;
            if (values.platformVersion) headers['sec-ch-ua-platform-version'] = `"${values.platformVersion}"`;
        }
        result = enrichWithClientHints(result, headers as HeaderRecord);
    }

    if (!result.context && isStandalonePWA(navigatorValue)) {
        result = {
            ...result,
            context: {
                kind: 'pwa',
                id: 'standalone',
                name: 'Standalone PWA',
                host: null,
            },
        };
    }

    return result;
}
