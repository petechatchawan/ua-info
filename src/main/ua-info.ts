import type {
    ApplicationInfo,
    ApplicationName,
    BrowserInfo,
    BrowserName,
    DeviceInfo,
    MappingEntry,
    OSInfo,
    OSName,
    PropertyDefinition,
    PropertyValue,
    UserAgentInfo,
    UserAgentResult,
} from '../types';
import { ApplicationMappings, BrowserMappings, RuntimeBrowserMappings } from '../mappings/browser';
import { OSMappings } from '../mappings/os';
import { DeviceMappings } from '../mappings/device';
import { formatVersion } from '../utils';

function createUnknownUserAgentInfo(userAgentString: string): UserAgentInfo {
    return {
        userAgentString,
        browser: {
            name: 'Other',
            version: '',
            toString: () => 'Other',
        },
        os: {
            name: 'Other',
            version: '',
            toString: () => 'Other',
        },
        device: {
            type: 'unknown',
            vendor: '',
            model: '',
            toString: () => 'Unknown',
        },
    };
}

class UAInfo {
    private userAgent: string = '';
    private uaInfo: UserAgentInfo = createUnknownUserAgentInfo('');

    constructor(userAgent?: string) {
        if (userAgent !== undefined) {
            this.setUserAgent(userAgent);
        }
    }

    public static parse(userAgent: string): UserAgentInfo {
        return new UAInfo(userAgent).getParsedUserAgent();
    }

    public setUserAgent(userAgent: string): this {
        this.userAgent = userAgent;
        this.uaInfo = this.parseUserAgent();
        return this;
    }

    public getParsedUserAgent(): UserAgentInfo {
        return this.uaInfo;
    }

    public parseUserAgent(): UserAgentInfo {
        const browserResult = this.mapper(BrowserMappings);
        const applicationResult = this.mapper(ApplicationMappings);
        const runtimeBrowserResult = this.mapper(RuntimeBrowserMappings);
        const osResult = this.mapper(OSMappings);
        const deviceResult = this.mapper(DeviceMappings);

        const browser = this.createBrowserInfo(browserResult);
        const application = this.createApplicationInfo(applicationResult);
        const runtimeBrowser = this.hasResult(runtimeBrowserResult)
            ? this.createBrowserInfo(runtimeBrowserResult)
            : undefined;
        const os = this.createOSInfo(osResult);
        const device = this.createDeviceInfo(deviceResult);

        return {
            userAgentString: this.userAgent,
            browser,
            ...(application ? { application } : {}),
            ...(runtimeBrowser ? { runtimeBrowser } : {}),
            os,
            device,
        };
    }

    public mapper(mappings: MappingEntry[]): UserAgentResult {
        const result: UserAgentResult = {};
        for (let i = 0; i < mappings.length; i++) {
            const entry = mappings[i];
            for (let j = 0; j < entry.regex.length; j++) {
                const regex = entry.regex[j];
                const matches = regex.exec(this.userAgent.toLowerCase());
                if (matches) {
                    this.processProperties(matches, entry.properties, result);
                    break;
                }
            }

            if (this.hasResult(result)) {
                break;
            }
        }

        return result;
    }

    private processProperties(
        matches: RegExpExecArray,
        properties: PropertyDefinition,
        result: UserAgentResult,
    ): void {
        const keys = Object.keys(properties) as (keyof PropertyDefinition)[];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const prop = properties[key];
            const match = matches[i + 1];
            if (typeof prop === 'string') {
                result[key] = prop;
            } else if (prop) {
                this.applyProperty(key, prop, match, result);
            }
        }
    }

    private applyProperty(
        key: string,
        prop: PropertyValue,
        match: string | undefined,
        result: UserAgentResult,
    ): void {
        let value: unknown;
        if (typeof prop.value === 'function') {
            value = prop.value.call(this, match);
        } else {
            value = prop.value;
        }

        if (prop.transform) {
            result[key] = prop.transform.call(this, match, value);
        } else {
            result[key] = value;
        }
    }

    private createBrowserInfo(result: UserAgentResult): BrowserInfo {
        const name = (result['name'] as BrowserName | undefined) ?? 'Other';
        const version = this.asString(result['version']);
        const type = this.asString(result['type']);

        return {
            name,
            version,
            ...(type ? { type } : {}),
            toString: () => `${name} ${version}`.trim(),
        };
    }

    private createApplicationInfo(result: UserAgentResult): ApplicationInfo | undefined {
        if (!this.hasResult(result)) {
            return undefined;
        }

        const name = (result['name'] as ApplicationName | undefined) ?? 'Other';
        const version = this.asString(result['version']);
        const context = name === 'Line' && this.hasLiffToken() ? 'liff' : 'inapp';

        return {
            name,
            version,
            type: 'inapp',
            context,
            toString: () => `${name} ${version}`.trim(),
        };
    }

    private createOSInfo(result: UserAgentResult): OSInfo {
        const name = (result['name'] as OSName | undefined) ?? 'Other';
        const version = this.asString(result['version']);

        return {
            name,
            version,
            toString: () => `${name} ${formatVersion(version)}`.trim(),
        };
    }

    private createDeviceInfo(result: UserAgentResult): DeviceInfo {
        const type = this.asString(result['type']) || 'unknown';
        const vendor = this.asString(result['vendor']);
        const model = this.asString(result['model']);

        return {
            type,
            vendor,
            model,
            toString: () => `${vendor} ${model}`.trim() || 'Unknown',
        };
    }

    private hasResult(result: UserAgentResult): boolean {
        return Object.keys(result).length > 0;
    }

    private asString(value: unknown): string {
        return typeof value === 'string' ? value : '';
    }

    public getBrowser(): BrowserInfo {
        return this.uaInfo.browser;
    }

    public getApplication(): ApplicationInfo | undefined {
        return this.uaInfo.application;
    }

    public getRuntimeBrowser(): BrowserInfo | undefined {
        return this.uaInfo.runtimeBrowser;
    }

    public getOS(): OSInfo {
        return this.uaInfo.os;
    }

    public getCpuCoreCount(): number | null {
        if (typeof navigator === 'undefined') return null;
        return navigator.hardwareConcurrency ?? null;
    }

    public getMemory(): number | null {
        if (typeof navigator === 'undefined') return null;
        return (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
    }

    public getDevice(): DeviceInfo {
        return this.uaInfo.device;
    }

    /**
     * @deprecated Use isCurrentEnvironmentIPad() for the current browser or
     * isParsedIPad() for the user-agent string supplied to this instance.
     */
    public isIPad(): boolean {
        return this.isCurrentEnvironmentIPad();
    }

    public isParsedIPad(): boolean {
        return this.uaInfo.device.type === 'tablet' && this.uaInfo.device.vendor === 'Apple';
    }

    public isCurrentEnvironmentIPad(): boolean {
        if (typeof navigator === 'undefined') return false;

        const isExplicitIPad = navigator.userAgent.includes('iPad');
        if (isExplicitIPad) return true;

        return (
            typeof document !== 'undefined' &&
            navigator.userAgent.includes('Macintosh') &&
            'ontouchend' in document &&
            navigator.maxTouchPoints > 1
        );
    }

    public isBrowser(names: BrowserName | BrowserName[]): boolean {
        const browserNames = Array.isArray(names) ? names : [names];
        return browserNames.includes(this.uaInfo.browser.name);
    }

    public isApplication(names: ApplicationName | ApplicationName[]): boolean {
        const applicationNames = Array.isArray(names) ? names : [names];
        const application = this.uaInfo.application;
        return application ? applicationNames.includes(application.name) : false;
    }

    public isRuntimeBrowser(names: BrowserName | BrowserName[]): boolean {
        const browserNames = Array.isArray(names) ? names : [names];
        const runtimeBrowser = this.uaInfo.runtimeBrowser;
        return runtimeBrowser ? browserNames.includes(runtimeBrowser.name) : false;
    }

    public isInAppBrowser(): boolean {
        return this.uaInfo.application?.type === 'inapp' || this.uaInfo.browser.type === 'inapp';
    }

    public hasLiffToken(): boolean {
        return /\bLIFF\b/i.test(this.userAgent);
    }

    public isLiff(): boolean {
        return this.uaInfo.application?.name === 'Line' && this.hasLiffToken();
    }

    public isOS(names: OSName | OSName[]): boolean {
        const osNames = Array.isArray(names) ? names : [names];
        return osNames.includes(this.uaInfo.os.name);
    }

    public isDevice(types: string | string[]): boolean {
        const deviceTypes = Array.isArray(types) ? types : [types];
        return deviceTypes.includes(this.uaInfo.device.type);
    }

    public isMobile(): boolean {
        return this.uaInfo.device.type === 'mobile';
    }

    public isDesktop(): boolean {
        return this.uaInfo.device.type === 'desktop';
    }

    public isTablet(): boolean {
        return this.uaInfo.device.type === 'tablet';
    }

    public isBrowserVersionAtLeast(version: string): boolean {
        const comparison = this.compareVersions(this.uaInfo.browser.version, version);
        return comparison !== null && comparison >= 0;
    }

    public isRuntimeBrowserVersionAtLeast(version: string): boolean {
        const runtimeBrowser = this.uaInfo.runtimeBrowser;
        if (!runtimeBrowser) return false;

        const comparison = this.compareVersions(runtimeBrowser.version, version);
        return comparison !== null && comparison >= 0;
    }

    public isOSVersionAtLeast(version: string): boolean {
        const comparison = this.compareVersions(this.uaInfo.os.version, version);
        return comparison !== null && comparison >= 0;
    }

    private compareVersions(current: string, target: string): number | null {
        const currentParts = this.parseVersion(current);
        const targetParts = this.parseVersion(target);
        if (!currentParts || !targetParts) return null;

        const maxLength = Math.max(currentParts.length, targetParts.length);

        for (let i = 0; i < maxLength; i++) {
            const currentPart = currentParts[i] ?? 0;
            const targetPart = targetParts[i] ?? 0;
            const diff = currentPart - targetPart;

            if (diff !== 0) {
                return Math.sign(diff);
            }
        }

        return 0;
    }

    private parseVersion(version: string): number[] | null {
        const normalized = version.trim().replace(/,/g, '.');
        if (!/^\d+(?:\.\d+)*$/.test(normalized)) return null;

        const parts = normalized.split('.').map(Number);
        return parts.every(Number.isFinite) ? parts : null;
    }
}

export {
    UAInfo,
    type MappingEntry,
    type PropertyDefinition,
    type PropertyValue,
    type UserAgentResult,
};
