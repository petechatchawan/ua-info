import { OSId } from '../constants';
import type { OSInfo } from '../types';
import { parseVersion } from '../version';

function createOS(name: OSInfo['name'], versionRaw?: string): OSInfo {
  return {
    name,
    version: versionRaw ? parseVersion(versionRaw.replace(/_/g, '.')) : null,
  };
}

function windowsVersion(ntVersion: string): string {
  const versions: Readonly<Record<string, string>> = {
    '10.0': '10',
    '6.3': '8.1',
    '6.2': '8',
    '6.1': '7',
    '6.0': 'Vista',
    '5.2': 'XP',
    '5.1': 'XP',
    '5.0': '2000',
  };
  return versions[ntVersion] ?? ntVersion;
}

export function detectOS(userAgent: string): OSInfo {
  const windowsPhone = /Windows Phone(?: OS)?[ /]([0-9.]+)/i.exec(userAgent);
  if (windowsPhone?.[1]) return createOS(OSId.Windows, windowsPhone[1]);

  const windows = /Windows NT[ /]([0-9.]+)/i.exec(userAgent);
  if (windows?.[1]) return createOS(OSId.Windows, windowsVersion(windows[1]));

  const ipadOS = /\biPad\b.*?(?:CPU )?OS[ _/]([0-9_]+)/i.exec(userAgent);
  if (ipadOS?.[1]) return createOS(OSId.IPadOS, ipadOS[1]);

  const ios = /(?:CPU (?:iPhone )?OS|iPhone OS)[ _/]([0-9_]+)/i.exec(userAgent);
  if (ios?.[1]) return createOS(OSId.IOS, ios[1]);

  const harmony = /HarmonyOS[ /]([0-9.]+)/i.exec(userAgent);
  if (harmony?.[1]) return createOS(OSId.HarmonyOS, harmony[1]);

  const android = /Android[ /]([0-9.]+)/i.exec(userAgent);
  if (android?.[1]) return createOS(OSId.Android, android[1]);

  const chromeOS = /CrOS\s+[^\s)]+\s+([0-9.]+)/i.exec(userAgent);
  if (chromeOS?.[1]) return createOS(OSId.ChromeOS, chromeOS[1]);

  const macOS = /Mac OS X[ /]([0-9_]+)/i.exec(userAgent);
  if (macOS?.[1]) return createOS(OSId.MacOS, macOS[1]);

  const kaiOS = /KaiOS[ /]([0-9.]+)/i.exec(userAgent);
  if (kaiOS?.[1]) return createOS(OSId.KaiOS, kaiOS[1]);

  const tizen = /Tizen[ /]([0-9.]+)/i.exec(userAgent);
  if (tizen?.[1]) return createOS(OSId.Tizen, tizen[1]);

  if (/\bLinux\b/i.test(userAgent)) return createOS(OSId.Linux);
  return { name: null, version: null };
}
