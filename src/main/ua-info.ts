import type { MappingEntry, UserAgentResult, PropertyDefinition, PropertyValue } from '../types';
import type { BrowserInfo, OSInfo, DeviceInfo, UserAgentInfo } from '../types';
import { BrowserMappings } from '../mappings/browser';
import { OSMappings } from '../mappings/os';
import { DeviceMappings } from '../mappings/device';
import { formatVersion } from '../utils';
import type { BrowserName, OSName } from '../types';

class UAInfo {
    private userAgent: string = '';
    private uaInfo!: UserAgentInfo;

    constructor() {}

    public setUserAgent(userAgent: string): this {
        this.userAgent = userAgent;
        this.uaInfo = this.parseUserAgent();
        return this;
    }

    public getParsedUserAgent(): UserAgentInfo {
        return this.uaInfo;
    }

    public parseUserAgent(): UserAgentInfo {
        const browser = this.mapper(BrowserMappings);
        const os = this.mapper(OSMappings);
        const device = this.mapper(DeviceMappings);

        return {
            userAgentString: this.userAgent,
            browser: {
                name: browser['name'],
                version: browser['version'],
                ...(browser['type'] ? { type: browser['type'] } : {}),
                toString: () => `${browser['name']} ${browser['version']}`.trim(),
            },
            os: {
                name: os['name'],
                version: os['version'],
                toString: () => `${os['name']} ${formatVersion(os['version'])}`.trim(),
            },
            device: {
                type: device['type'],
                vendor: device['vendor'],
                model: device['model'],
                toString: () => `${device['vendor']} ${device['model']}`.trim(),
            },
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

            if (Object.keys(result).length > 0) {
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
        let value: any;
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

    public getBrowser(): BrowserInfo {
        return this.uaInfo.browser;
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
        return (navigator as any).deviceMemory ?? null;
    }

    public getDevice(): DeviceInfo {
        return this.uaInfo.device;
    }

    public isIPad(): boolean {
        if (typeof navigator === 'undefined') return false;
        return (
            navigator.userAgent.includes('iPad') ||
            (navigator.userAgent.includes('Macintosh') &&
                'ontouchend' in document &&
                navigator.maxTouchPoints > 1)
        );
    }

    public isBrowser(names: BrowserName | BrowserName[]): boolean {
        const browserNames = Array.isArray(names) ? names : [names];
        return browserNames.includes(this.uaInfo.browser.name);
    }

    public isInAppBrowser(): boolean {
        return this.uaInfo.browser.type === 'inapp';
    }

    public isLiff(): boolean {
        return this.isInAppBrowser() && this.uaInfo.browser.name === 'Line';
    }

    public isOS(names: OSName | OSName[]): boolean {
        const browserNames = Array.isArray(names) ? names : [names];
        return browserNames.includes(this.uaInfo.os.name);
    }

    public isDevice(types: string | string[]): boolean {
        const deviceTypes = Array.isArray(types) ? types : [types];
        return deviceTypes.includes(this.uaInfo.device?.type);
    }

    public isMobile(): boolean {
        return this.uaInfo.device?.type === 'mobile';
    }

    public isDesktop(): boolean {
        return this.uaInfo.device?.type === 'desktop';
    }

    public isTablet(): boolean {
        return this.uaInfo.device?.type === 'tablet';
    }

    public isBrowserVersionAtLeast(version: string): boolean {
        return this.compareVersions(this.uaInfo.browser.version, version) >= 0;
    }

    public isOSVersionAtLeast(version: string): boolean {
        return this.compareVersions(this.uaInfo.os.version, version) >= 0;
    }

    private compareVersions(current: string, target: string): number {
        const currentParts = current.split('.').map(Number);
        const targetParts = target.split('.').map(Number);
        const maxLength = Math.max(currentParts.length, targetParts.length);

        for (let i = 0; i < maxLength; i++) {
            const currentPart = currentParts[i] || 0;
            const targetPart = targetParts[i] || 0;
            const diff = currentPart - targetPart;

            if (diff !== 0) {
                return Math.sign(diff);
            }
        }

        return 0;
    }
}

export {
    UAInfo,
    type MappingEntry,
    type PropertyDefinition,
    type PropertyValue,
    type UserAgentResult,
};
