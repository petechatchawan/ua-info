import type { RowSpec } from '../core/match';
import { osIn } from './os';

export interface DeviceSignal {
  /** Hardware that a User-Agent word names outright (`iPad`), when no model string follows. */
  readonly vendor?: string;
  readonly model?: string;
}

export interface DeviceRow extends RowSpec<string, DeviceSignal> {
  readonly label: string;
}

const specific = ['mobile', 'tablet', 'desktop'] as const;

// A form-factor marker beats the generic Android, iOS and desktop guesses. Generic guesses are `fallback`.
const rows = {
  console: {
    label: 'Game console',
    beats: [...specific],
    match: [{ words: 'playstation', versionOptional: true }, { words: 'xbox', versionOptional: true }, { words: 'nintendo', versionOptional: true }],
  },
  desktop: {
    label: 'Desktop',
    match: [
      { words: 'windows', versionOptional: true, fallback: true },
      { words: 'macintosh', versionOptional: true, fallback: true, vendor: 'apple' },
      { words: 'cros', versionOptional: true, fallback: true },
      { words: 'x11', versionOptional: true, fallback: true },
      { words: 'linux x86_64', versionOptional: true, fallback: true },
      { words: 'linux i686', versionOptional: true, fallback: true },
    ],
  },
  embedded: {
    label: 'Embedded device',
    match: [{ words: 'esp32', versionOptional: true }, { words: 'freertos', versionOptional: true }, { words: 'zephyr', versionOptional: true }],
  },
  mobile: {
    label: 'Mobile',
    match: [
      { words: 'iphone', versionOptional: true, vendor: 'apple', model: 'iPhone' },
      { words: 'ipod', versionOptional: true, vendor: 'apple', model: 'iPod' },
      { words: 'windows phone', versionOptional: true },
      { words: 'mobile', os: osIn('android', 'harmonyos'), versionOptional: true },
    ],
  },
  'smart-tv': {
    label: 'Smart TV',
    beats: [...specific],
    match: [
      { words: 'smarttv', versionOptional: true },
      { words: 'smart-tv', versionOptional: true },
      { words: 'hbbtv', versionOptional: true },
      { words: 'netcast', versionOptional: true },
      { words: 'web0s', versionOptional: true },
      { words: 'webos.tv', versionOptional: true },
      { words: 'crkey', versionOptional: true },
      { words: 'tv', with: ['tizen'], versionOptional: true },
    ],
  },
  tablet: {
    label: 'Tablet',
    match: [
      { words: 'ipad', versionOptional: true, vendor: 'apple', model: 'iPad' },
      { words: 'android', without: ['mobile'], versionOptional: true, fallback: true },
    ],
  },
  wearable: {
    label: 'Wearable',
    beats: [...specific],
    match: [{ words: 'watch', versionOptional: true }, { words: 'wear os', versionOptional: true }],
  },
  xr: {
    label: 'XR headset',
    beats: [...specific],
    match: [{ words: 'quest', versionOptional: true, vendor: 'meta' }, { product: 'OculusBrowser', versionOptional: true, vendor: 'meta' }],
  },
} as const satisfies Readonly<Record<string, DeviceRow>>;

export type DeviceType = keyof typeof rows;
export const DEVICE_TYPES: Readonly<Record<DeviceType, DeviceRow>> = rows;
