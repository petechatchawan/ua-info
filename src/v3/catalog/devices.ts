import type { RowSpec } from '../core/match';
import type { DeviceType } from '../types';

export interface DeviceSignal {
  /** Hardware that a User-Agent word names outright (`iPad`), when no model string follows. */
  readonly vendor?: string;
  readonly model?: string;
}

export type DeviceRow = RowSpec<DeviceType, DeviceSignal>;

const specific = ['mobile', 'tablet', 'desktop'] as const;

// A form-factor marker beats the generic Android, iOS and desktop guesses. Generic guesses are `fallback`.
export const DEVICE_TYPES: Readonly<Record<DeviceType, DeviceRow>> = {
  console: {
    beats: [...specific],
    match: [{ words: 'playstation', versionOptional: true }, { words: 'xbox', versionOptional: true }, { words: 'nintendo', versionOptional: true }],
  },
  desktop: {
    match: [
      { words: 'windows', versionOptional: true, fallback: true },
      { words: 'macintosh', versionOptional: true, fallback: true, vendor: 'Apple' },
      { words: 'cros', versionOptional: true, fallback: true },
      { words: 'x11', versionOptional: true, fallback: true },
      { words: 'linux x86_64', versionOptional: true, fallback: true },
      { words: 'linux i686', versionOptional: true, fallback: true },
    ],
  },
  embedded: {
    match: [{ words: 'esp32', versionOptional: true }, { words: 'freertos', versionOptional: true }, { words: 'zephyr', versionOptional: true }],
  },
  mobile: {
    match: [
      { words: 'iphone', versionOptional: true, vendor: 'Apple', model: 'iPhone' },
      { words: 'ipod', versionOptional: true, vendor: 'Apple', model: 'iPod' },
      { words: 'windows phone', versionOptional: true },
      { words: 'mobile', os: ['android', 'harmonyos'], versionOptional: true },
    ],
  },
  'smart-tv': {
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
    match: [
      { words: 'ipad', versionOptional: true, vendor: 'Apple', model: 'iPad' },
      { words: 'android', without: ['mobile'], versionOptional: true, fallback: true },
    ],
  },
  wearable: {
    beats: [...specific],
    match: [{ words: 'watch', versionOptional: true }, { words: 'wear os', versionOptional: true }],
  },
  xr: {
    beats: [...specific],
    match: [{ words: 'quest', versionOptional: true, vendor: 'Meta' }, { product: 'OculusBrowser', versionOptional: true, vendor: 'Meta' }],
  },
};
