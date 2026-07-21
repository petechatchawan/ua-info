import type { ContextInfo, ContextKind, ProductInfo } from '../types';
import { parseVersion } from '../version';

function host(id: string, name: string, versionRaw?: string): ProductInfo {
    return {
        id,
        name,
        version: versionRaw ? parseVersion(versionRaw) : null,
    };
}

function context(kind: ContextKind, id: string | null, name: string | null, app: ProductInfo | null): ContextInfo {
    return { kind, id, name, host: app };
}

export function detectContext(userAgent: string): ContextInfo | null {
    const line = /\bLine\/([0-9]+(?:\.[0-9]+)*)/i.exec(userAgent);
    if (line?.[1]) {
        const lineHost = host('line', 'LINE', line[1]);
        if (/\bLIFF\b/i.test(userAgent)) return context('mini-app', 'liff', 'LIFF', lineHost);
        return context('in-app-browser', 'line-in-app', 'LINE In-App Browser', lineHost);
    }

    const facebook = /(?:FBAV\/|\[FBAN\/[^;\]]+;FBAV\/)([0-9.]+)/i.exec(userAgent);
    if (facebook?.[1]) {
        return context('in-app-browser', 'facebook-in-app', 'Facebook In-App Browser', host('facebook', 'Facebook', facebook[1]));
    }

    const instagram = /\bInstagram[ /]([0-9.]+)/i.exec(userAgent);
    if (instagram?.[1]) {
        return context('in-app-browser', 'instagram-in-app', 'Instagram In-App Browser', host('instagram', 'Instagram', instagram[1]));
    }

    const tiktok = /\b(?:musical_ly|TikTok)[_ /]([0-9.]+)/i.exec(userAgent);
    if (tiktok?.[1]) {
        return context('in-app-browser', 'tiktok-in-app', 'TikTok In-App Browser', host('tiktok', 'TikTok', tiktok[1]));
    }

    const twitter = /\bTwitter(?:Android| for iPhone)?[ /]([0-9.]+)/i.exec(userAgent);
    if (twitter?.[1]) {
        return context('in-app-browser', 'x-in-app', 'X In-App Browser', host('x', 'X', twitter[1]));
    }

    const weChat = /\bMicroMessenger\/([0-9.]+)/i.exec(userAgent);
    if (weChat?.[1]) {
        return context('in-app-browser', 'wechat-in-app', 'WeChat In-App Browser', host('wechat', 'WeChat', weChat[1]));
    }

    const telegram = /\bTelegram(?:Bot)?\/([0-9.]+)/i.exec(userAgent);
    if (telegram?.[1]) {
        return context('mini-app', 'telegram-mini-app', 'Telegram Mini App', host('telegram', 'Telegram', telegram[1]));
    }

    const electron = /\bElectron\/([0-9.]+)/i.exec(userAgent);
    if (electron?.[1]) return context('embedded', 'electron', 'Electron', host('electron', 'Electron', electron[1]));

    const capacitor = /\bCapacitor(?:\/([0-9.]+))?/i.exec(userAgent);
    if (capacitor) return context('embedded', 'capacitor', 'Capacitor', host('capacitor', 'Capacitor', capacitor[1]));

    const cordova = /\bCordova(?:\/([0-9.]+))?/i.exec(userAgent);
    if (cordova) return context('embedded', 'cordova', 'Cordova', host('cordova', 'Cordova', cordova[1]));

    return null;
}
