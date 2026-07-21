import type { MappingEntry } from '../types';

export const BrowserMappings: MappingEntry[] = [
    {
        regex: [/\b(?:crmo|crios)\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Chrome Mobile',
        },
    },
    {
        regex: [/edg(?:e|ios|a)?\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Edge',
        },
    },
    {
        regex: [/samsungbrowser\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Samsung Internet',
        },
    },
    {
        regex: [/HuaweiBrowser\/([\d\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Huawei Browser',
        },
    },
    {
        regex: [/XiaoMi\/MiuiBrowser\/([\d\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Xiaomi Browser',
        },
    },
    {
        kind: 'application',
        regex: [/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i],
        properties: {
            name: 'Facebook',
            version: { value: (match: string) => match },
            type: 'inapp',
        },
    },
    {
        kind: 'application',
        regex: [
            /safari (line)\/([\w\.]+)/i,
            /\b(line)\/([\w\.]+)\/iab/i,
            /\b(line)\/([\w\.]+)/i,
        ],
        properties: {
            name: 'Line',
            version: { value: (match: string) => match },
            type: 'inapp',
        },
    },
    {
        kind: 'application',
        regex: [/(twitter)(?:and| f.+e\/([\w\.]+))/i],
        properties: {
            name: 'Twitter',
            version: { value: (match: string) => match },
        },
    },
    {
        kind: 'application',
        regex: [/(instagram)[\/ ]([-\w\.]+)/i],
        properties: {
            name: 'Instagram',
            version: { value: (match: string) => match },
            type: 'inapp',
        },
    },
    {
        kind: 'application',
        regex: [/(musical_ly)(?:.+app_?version\/|_)([\w\.]+)/i],
        properties: {
            name: 'Tiktok',
            version: { value: (match: string) => match },
        },
    },
    {
        regex: [/headlesschrome(?:\/([\w\.]+)| )/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Headless Chrome',
        },
    },
    {
        regex: [/\bOPiOS\/([\w\.]+)/i, /Opera Mini\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Opera Mini',
        },
    },
    {
        regex: [/\b(?:OPR|OPT|OPX)\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Opera',
        },
    },
    {
        regex: [/\b(?:Vivaldi|VivaiOS)\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Vivaldi',
        },
    },
    {
        regex: [/\bYaBrowser\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Yandex',
        },
    },
    {
        regex: [/\bUCBrowser\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'UC Browser',
        },
    },
    {
        regex: [/\bArc\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Arc',
        },
    },
    {
        regex: [/\bBrave(?: Chrome)?\/([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Brave',
        },
    },
    {
        regex: [/ wv\).+(chrome)\/([\w\.]+)/i],
        properties: {
            name: 'Chrome Webview',
            version: { value: (match: string) => match },
        },
    },
    {
        regex: [/chrome\/([\w\.]+) mobile/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Chrome Mobile',
        },
    },
    {
        regex: [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Android Browser',
        },
    },
    {
        regex: [/(?:MSIE |Trident\/.*rv:|IEMobile\/)[\s\/]?([\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'IE',
        },
    },
    {
        regex: [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i],
        properties: {
            name: 'Chrome',
            version: { value: (match: string) => match },
        },
    },
    {
        regex: [/firefox\/(\d+(?:\.\d+)?)/, /\bFxiOS\/([\w\.]+)/i],
        properties: {
            name: 'Firefox',
            version: { value: (match: string) => match },
        },
    },
    {
        regex: [
            /version\/([\w\.\,]+) .*mobile(?:\/\w+ | ?)safari/i,
            /iphone .*mobile(?:\/\w+ | ?)safari/i,
        ],
        properties: {
            version: { value: (match: string) => match },
            name: 'Safari Mobile',
        },
    },
    {
        regex: [/version\/([\w\.\,]+) .*(safari)/i, /webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'Safari',
        },
    },
];

export const ApplicationMappings = BrowserMappings.filter((mapping) => mapping.kind === 'application');

export const RuntimeBrowserMappings = BrowserMappings.filter((mapping) => mapping.kind !== 'application');
