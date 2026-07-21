import type { DeviceInfo, DeviceType } from '../types';

function inferAndroidVendor(model: string): string | null {
    if (/^SM-|^GT-|^SCH-|^SGH-/i.test(model)) return 'Samsung';
    if (/^(?:Pixel|Nexus)/i.test(model)) return 'Google';
    if (/^(?:MI |MIX |M[0-9]|Redmi|POCO|2407FPN8EG)/i.test(model)) return 'Xiaomi';
    if (/^(?:HUAWEI|ANE-|ELE-|VOG-|NOH-|JAD-|ALN-|BRA-|CET-|LIO-|OCE-|PAL-|ALT-)/i.test(model)) return 'Huawei';
    if (/^(?:CPH|P[A-Z]{2}[A-Z0-9]+|OPPO)/i.test(model)) return 'Oppo';
    if (/^(?:V[0-9]{4}|vivo)/i.test(model)) return 'Vivo';
    if (/^(?:ONEPLUS|NE2|KB2|LE2|IN2)/i.test(model)) return 'OnePlus';
    if (/^(?:moto|XT[0-9])/i.test(model)) return 'Motorola';
    return null;
}

function androidModel(userAgent: string): string | null {
    const body = /Android[ /][0-9.]+;([^)]*)\)/i.exec(userAgent)?.[1];
    if (!body) return null;

    for (const rawSegment of body.split(';')) {
        const segment = rawSegment.trim().replace(/\s+Build\/[A-Z0-9._-]+.*$/i, '').trim();
        if (!segment || /^(?:wv|mobile|tablet|[a-z]{2}(?:-[A-Z]{2})?)$/i.test(segment)) continue;
        if (/^(?:arm|arm64|aarch64|x86|x86_64)$/i.test(segment)) continue;
        return segment;
    }

    return null;
}

function createDevice(type: DeviceType, vendor: string | null = null, model: string | null = null): DeviceInfo {
    return { type, vendor, model };
}

export function detectDevice(userAgent: string): DeviceInfo {
    if (/\b(?:Quest|OculusBrowser)\b/i.test(userAgent)) return createDevice('xr', 'Meta', null);
    if (/\b(?:PlayStation|Xbox|Nintendo)\b/i.test(userAgent)) return createDevice('console');
    if (/\b(?:SmartTV|SMART-TV|HbbTV|NetCast|Web0S|webOS.TV|Tizen.+TV)\b/i.test(userAgent)) {
        return createDevice('smart-tv');
    }
    if (/\b(?:Watch|Wear OS|Tizen.+Mobile.+Watch)\b/i.test(userAgent)) return createDevice('wearable');

    if (/\biPad\b/i.test(userAgent)) return createDevice('tablet', 'Apple', 'iPad');
    if (/\biPhone\b/i.test(userAgent)) return createDevice('mobile', 'Apple', 'iPhone');
    if (/\biPod\b/i.test(userAgent)) return createDevice('mobile', 'Apple', 'iPod');

    if (/\bAndroid\b/i.test(userAgent)) {
        const model = androidModel(userAgent);
        const type: DeviceType = /\bMobile\b/i.test(userAgent) ? 'mobile' : 'tablet';
        return createDevice(type, model ? inferAndroidVendor(model) : null, model);
    }

    if (/\b(?:Windows|Macintosh|CrOS|X11|Linux x86|Linux i686)\b/i.test(userAgent)) {
        const vendor = /\bMacintosh\b/i.test(userAgent) ? 'Apple' : null;
        return createDevice('desktop', vendor, null);
    }

    if (/\b(?:Electron|Cordova|Capacitor)\b/i.test(userAgent)) return createDevice('embedded');

    return createDevice('unknown');
}
