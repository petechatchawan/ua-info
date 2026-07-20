import { BrowserMappings } from '../mappings/browser';
import { OSMappings } from '../mappings/os';
import { DeviceMappings } from '../mappings/device';
import { formatVersion } from '../utils';
class UAInfo {
    constructor() {
        this.userAgent = '';
    }
    setUserAgent(userAgent) {
        this.userAgent = userAgent;
        this.uaInfo = this.parseUserAgent();
        return this;
    }
    getParsedUserAgent() {
        return this.uaInfo;
    }
    parseUserAgent() {
        const browser = this.mapper(BrowserMappings);
        const os = this.mapper(OSMappings);
        const device = this.mapper(DeviceMappings);
        return {
            userAgentString: this.userAgent,
            browser: Object.assign(Object.assign({ name: browser['name'], version: browser['version'] }, (browser['type'] ? { type: browser['type'] } : {})), { toString: () => `${browser['name']} ${browser['version']}`.trim() }),
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
    mapper(mappings) {
        const result = {};
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
    processProperties(matches, properties, result) {
        const keys = Object.keys(properties);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const prop = properties[key];
            const match = matches[i + 1];
            if (typeof prop === 'string') {
                result[key] = prop;
            }
            else if (prop) {
                this.applyProperty(key, prop, match, result);
            }
        }
    }
    applyProperty(key, prop, match, result) {
        let value;
        if (typeof prop.value === 'function') {
            value = prop.value.call(this, match);
        }
        else {
            value = prop.value;
        }
        if (prop.transform) {
            result[key] = prop.transform.call(this, match, value);
        }
        else {
            result[key] = value;
        }
    }
    getBrowser() {
        return this.uaInfo.browser;
    }
    getOS() {
        return this.uaInfo.os;
    }
    getCpuCoreCount() {
        var _a;
        if (typeof navigator === 'undefined')
            return null;
        return (_a = navigator.hardwareConcurrency) !== null && _a !== void 0 ? _a : null;
    }
    getMemory() {
        var _a;
        if (typeof navigator === 'undefined')
            return null;
        return (_a = navigator.deviceMemory) !== null && _a !== void 0 ? _a : null;
    }
    getDevice() {
        return this.uaInfo.device;
    }
    isIPad() {
        if (typeof navigator === 'undefined')
            return false;
        return (navigator.userAgent.includes('iPad') ||
            (navigator.userAgent.includes('Macintosh') &&
                'ontouchend' in document &&
                navigator.maxTouchPoints > 1));
    }
    isBrowser(names) {
        const browserNames = Array.isArray(names) ? names : [names];
        return browserNames.includes(this.uaInfo.browser.name);
    }
    isInAppBrowser() {
        return this.uaInfo.browser.type === 'inapp';
    }
    isLiff() {
        return this.isInAppBrowser() && this.uaInfo.browser.name === 'Line';
    }
    isOS(names) {
        const browserNames = Array.isArray(names) ? names : [names];
        return browserNames.includes(this.uaInfo.os.name);
    }
    isDevice(types) {
        var _a;
        const deviceTypes = Array.isArray(types) ? types : [types];
        return deviceTypes.includes((_a = this.uaInfo.device) === null || _a === void 0 ? void 0 : _a.type);
    }
    isMobile() {
        var _a;
        return ((_a = this.uaInfo.device) === null || _a === void 0 ? void 0 : _a.type) === 'mobile';
    }
    isDesktop() {
        var _a;
        return ((_a = this.uaInfo.device) === null || _a === void 0 ? void 0 : _a.type) === 'desktop';
    }
    isTablet() {
        var _a;
        return ((_a = this.uaInfo.device) === null || _a === void 0 ? void 0 : _a.type) === 'tablet';
    }
    isBrowserVersionAtLeast(version) {
        return this.compareVersions(this.uaInfo.browser.version, version) >= 0;
    }
    isOSVersionAtLeast(version) {
        return this.compareVersions(this.uaInfo.os.version, version) >= 0;
    }
    compareVersions(current, target) {
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
export { UAInfo, };
