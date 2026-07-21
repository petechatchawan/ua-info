import { BrowserFamily, BrowserId, CPUArchitecture, EngineId, OSId } from '../constants';
import type { BrowserInfo, CPUInfo, OSInfo, UAResult } from '../types';
import { parseVersion } from '../version';

export type HeaderValue = string | readonly string[] | undefined;
export type HeaderRecord = Readonly<Record<string, HeaderValue>>;
export interface HeaderGetter {
    get(name: string): string | null;
}
export type HeaderSource = HeaderRecord | HeaderGetter;

function isHeaderGetter(headers: HeaderSource): headers is HeaderGetter {
    return typeof (headers as HeaderGetter).get === 'function';
}

export function readHeader(headers: HeaderSource, name: string): string | null {
    if (isHeaderGetter(headers)) return headers.get(name);

    const target = name.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() !== target || value === undefined) continue;
        return Array.isArray(value) ? value.join(', ') : value;
    }
    return null;
}

function unquote(value: string | null): string | null {
    if (value === null) return null;
    return value.trim().replace(/^"|"$/g, '');
}

interface BrandVersion {
    readonly brand: string;
    readonly version: string;
}

function parseBrands(value: string | null): readonly BrandVersion[] {
    if (!value) return [];
    const brands: BrandVersion[] = [];
    const regex = /"([^"]+)"\s*;\s*v="([0-9.]+)"/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(value)) !== null) {
        if (!/not[\s_-]*a[\s_-]*brand/i.test(match[1])) {
            brands.push({ brand: match[1], version: match[2] });
        }
    }
    return brands;
}

function selectBrowser(brands: readonly BrandVersion[], current: BrowserInfo | null): BrowserInfo | null {
    const candidates = [
        { match: /Microsoft Edge/i, id: BrowserId.Edge, name: 'Edge', family: BrowserFamily.Chromium },
        { match: /Opera/i, id: BrowserId.Opera, name: 'Opera', family: BrowserFamily.Chromium },
        { match: /Google Chrome/i, id: BrowserId.Chrome, name: 'Chrome', family: BrowserFamily.Chromium },
        { match: /^Chromium$/i, id: BrowserId.Chrome, name: 'Chrome', family: BrowserFamily.Chromium },
    ];

    for (const candidate of candidates) {
        const brand = brands.find((item) => candidate.match.test(item.brand));
        if (!brand) continue;
        return {
            id: candidate.id,
            name: candidate.name,
            family: candidate.family,
            mode: current?.mode ?? 'browser',
            version: parseVersion(brand.version),
        };
    }
    return current;
}

function platformOS(platform: string | null, version: string | null, current: OSInfo | null): OSInfo | null {
    if (!platform) return current;
    const normalized = platform.toLowerCase();
    const details: ReadonlyArray<readonly [RegExp, string, string]> = [
        [/windows/, OSId.Windows, 'Windows'],
        [/android/, OSId.Android, 'Android'],
        [/(?:macos|mac os)/, OSId.MacOS, 'macOS'],
        [/ios/, OSId.IOS, 'iOS'],
        [/(?:chrome os|chromeos)/, OSId.ChromeOS, 'ChromeOS'],
        [/linux/, OSId.Linux, 'Linux'],
    ];
    const selected = details.find(([pattern]) => pattern.test(normalized));
    if (!selected) return current;
    return { id: selected[1], name: selected[2], version: version ? parseVersion(version) : current?.version ?? null };
}

function clientHintCPU(architecture: string | null, bitnessRaw: string | null, current: CPUInfo | null): CPUInfo | null {
    if (!architecture && !bitnessRaw) return current;
    const arch = architecture?.toLowerCase();
    let normalized: string | null = current?.architecture ?? null;
    if (arch === 'arm' || arch === 'arm64') normalized = bitnessRaw === '64' ? CPUArchitecture.ARM64 : CPUArchitecture.ARM;
    if (arch === 'x86' || arch === 'x86_64') normalized = bitnessRaw === '64' ? CPUArchitecture.X86_64 : CPUArchitecture.X86;
    const bitness = bitnessRaw === '64' ? 64 : bitnessRaw === '32' ? 32 : current?.bitness ?? null;
    return { architecture: normalized, bitness };
}

export function enrichWithClientHints(result: UAResult, headers: HeaderSource): UAResult {
    const fullBrands = parseBrands(readHeader(headers, 'sec-ch-ua-full-version-list'));
    const lowBrands = parseBrands(readHeader(headers, 'sec-ch-ua'));
    const brands = fullBrands.length > 0 ? fullBrands : lowBrands;
    const browser = selectBrowser(brands, result.browser);
    const platform = unquote(readHeader(headers, 'sec-ch-ua-platform'));
    const platformVersion = unquote(readHeader(headers, 'sec-ch-ua-platform-version'));
    const mobile = readHeader(headers, 'sec-ch-ua-mobile');
    const model = unquote(readHeader(headers, 'sec-ch-ua-model'));
    const architecture = unquote(readHeader(headers, 'sec-ch-ua-arch'));
    const bitness = unquote(readHeader(headers, 'sec-ch-ua-bitness'));

    return {
        ...result,
        browser,
        engine: browser?.family === BrowserFamily.Chromium
            ? { id: EngineId.Blink, name: 'Blink', version: null }
            : result.engine,
        os: platformOS(platform, platformVersion, result.os),
        device: {
            ...result.device,
            type: mobile === '?1' ? 'mobile' : result.device.type,
            model: model || result.device.model,
        },
        cpu: clientHintCPU(architecture, bitness, result.cpu),
    };
}
