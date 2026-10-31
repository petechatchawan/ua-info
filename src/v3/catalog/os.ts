import type { OSId } from '../constants';
import type { RowSpec } from '../core/match';
import type { Version } from '../types';

export interface OSRow extends RowSpec<OSId> {
  /** Sec-CH-UA-Platform values that name this OS. An empty list means none is known. */
  readonly platforms: readonly string[];
  /** Maps a raw version to the one published scale. A null value means the raw number is not a version. */
  readonly scale?: {
    readonly ua?: Readonly<Record<string, string | null>>;
    readonly hint?: (version: Version) => string | null;
  };
}

// UA-CH platformVersion for Windows: 13 and later is Windows 11, 1 to 12 is Windows 10, 0 is older and unknown.
function windowsFromPlatformVersion(version: Version): string | null {
  if (version.major === null || version.major < 1) return null;
  return version.major >= 13 ? '11' : '10';
}

export const OPERATING_SYSTEMS: Readonly<Record<OSId, OSRow>> = {
  android: {
    platforms: ['Android'],
    match: [{ words: 'android', versionOptional: true }],
  },
  chromeos: {
    platforms: ['Chrome OS', 'ChromeOS'],
    match: [{ words: 'cros', skip: 1 }],
  },
  harmonyos: {
    platforms: [],
    beats: ['android'],
    match: [{ words: 'harmonyos', versionOptional: true }],
  },
  ios: {
    platforms: ['iOS'],
    match: [{ words: 'cpu iphone os' }, { words: 'iphone os' }],
  },
  ipados: {
    platforms: ['iPadOS'],
    beats: ['ios'],
    match: [
      { words: 'cpu os', with: ['ipad'] },
      { words: 'cpu iphone os', with: ['ipad'] },
      { words: 'iphone os', with: ['ipad'] },
    ],
  },
  kaios: { platforms: [], match: [{ words: 'kaios' }] },
  linux: {
    platforms: ['Linux'],
    match: [{ words: 'linux', versionOptional: true, fallback: true }],
  },
  macos: {
    platforms: ['macOS'],
    match: [{ words: 'mac os x' }],
  },
  tizen: { platforms: [], match: [{ words: 'tizen' }] },
  windows: {
    platforms: ['Windows'],
    beats: ['android', 'linux'],
    match: [{ words: 'windows nt' }, { words: 'windows phone os' }, { words: 'windows phone' }],
    scale: {
      ua: { '10.0': '10', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': null, '5.2': null, '5.1': null, '5.0': null },
      hint: windowsFromPlatformVersion,
    },
  },
};
