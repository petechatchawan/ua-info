import type { MappingEntry } from '../types';
import { formatVersion } from '../utils';

export const WindowsVersionMappings: Record<string, RegExp> = {
    '11': /nt 11/i,
    '10': /nt 10/i,
    '8.1': /nt 6.3/i,
    '8': /nt 6.2/i,
    '7': /nt 6.1/i,
    Vista: /nt 6.0/i,
    XP: /nt 5.1/i,
    '2000': /nt 5.0/i,
    ME: /9x 4.90/i,
    '98': /98/i,
    '95': /95/i,
    'NT 4.0': /nt 4.0/i,
    'NT 3.51': /nt 3.51/i,
    'NT 3.11': /nt 3.11/i,
    CE: /ce/i,
    RT: /rt/i,
};

function mapWindows(str: string): string {
    for (const [key, value] of Object.entries(WindowsVersionMappings)) {
        if (value.test(str)) {
            return key;
        }
    }
    return str;
}

export const OSMappings: MappingEntry[] = [
    {
        regex: [
            /windows nt 6\.2; (arm)/i,
            /windows (?:phone(?: os)?|mobile)[\/ ]?([\d\.]+)/i,
            /windows[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i,
            /win(?=3|9|n|1|2000|xp|vista|7|8|10|11)|win 9x/i,
            /windows me/i,
        ],
        properties: {
            version: {
                value: (match: string) => match,
                transform: (value: string) => mapWindows(value),
            },
            name: 'Windows',
        },
    },
    {
        regex: [
            /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i,
            /(?:ios;fbsv\/|iphone.+ios[\/ ])([\d\.]+)/i,
            /cfnetwork\/.+darwin/i,
        ],
        properties: {
            version: {
                value: (match: string) => match,
                transform: (value: string) => formatVersion(value),
            },
            name: 'iOS',
        },
    },
    {
        regex: [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i],
        properties: {
            name: 'MacOS',
            version: {
                value: (match: string) => match,
                transform: (value: string) => formatVersion(value),
            },
        },
    },
    {
        regex: [/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i],
        properties: {
            version: { value: (match: string) => match },
            name: 'HarmonyOS',
        },
    },
    {
        regex: [
            /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
            /(blackberry)\w*\/([\w\.]*)/i,
            /(tizen|kaios)[\/ ]([\w\.]+)/i,
            /\((series40);/i,
        ],
        properties: {
            name: 'Android',
            version: { value: (match: string) => match },
        },
    },
    {
        regex: [/(cros) [\w]+(?:\)| ([\w\.]+)\b)/i],
        properties: {
            name: 'Chrome OS',
            version: { value: (match: string) => match },
        },
    },
    {
        regex: [/(linux) ?([\w\.]*)/i],
        properties: {
            name: 'Linux',
            version: { value: (match: string) => match },
        },
    },
];
