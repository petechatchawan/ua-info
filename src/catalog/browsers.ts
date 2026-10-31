import type { RowSpec } from '../core/match';
import type { BrowserFamily, BrowserMode, EngineId } from '../types';
import { osIn } from './os';

export interface BrowserSignal {
  readonly family?: BrowserFamily | null;
  readonly engine?: EngineId | null;
  readonly mode?: BrowserMode;
}

export interface BrowserRow extends RowSpec<string, BrowserSignal> {
  readonly label: string;
  readonly family: BrowserFamily | null;
  readonly engine: EngineId | null;
  /** Sec-CH-UA brand names that identify this product. An empty list means no brand is known. */
  readonly brands: readonly string[];
  /** The brand names a generic identity, so a specific UA product is not replaced by it. */
  readonly brandIsFallback?: true;
}

const rows = {
  arc: { label: 'Arc', family: 'chromium', engine: 'blink', brands: [], match: ['Arc'] },
  brave: {
    label: 'Brave',
    family: 'chromium',
    engine: 'blink',
    brands: ['Brave'],
    match: ['Brave', { product: 'Brave', os: osIn('ios', 'ipados'), versionOptional: true, family: null }],
  },
  chrome: {
    label: 'Google Chrome',
    family: 'chromium',
    engine: 'blink',
    brands: ['Google Chrome'],
    brandIsFallback: true,
    match: [
      { product: 'Chrome', fallback: true },
      'CriOS',
      { product: 'HeadlessChrome', mode: 'headless' },
    ],
  },
  chromium: { label: 'Chromium', family: 'chromium', engine: 'blink', brands: [], match: ['Chromium'] },
  edge: {
    label: 'Microsoft Edge',
    family: 'chromium',
    engine: 'blink',
    brands: ['Microsoft Edge'],
    match: ['Edg', 'EdgA', 'EdgiOS', { product: 'Edge', family: null, engine: null }],
  },
  firefox: { label: 'Firefox', family: 'firefox', engine: 'gecko', brands: [], match: ['Firefox', 'FxiOS'] },
  'huawei-browser': { label: 'Huawei Browser', family: 'chromium', engine: 'blink', brands: [], match: ['HuaweiBrowser'] },
  'mi-browser': { label: 'Mi Browser', family: 'chromium', engine: 'blink', brands: [], match: ['MiuiBrowser'] },
  opera: {
    label: 'Opera',
    family: 'chromium',
    engine: 'blink',
    brands: ['Opera'],
    match: ['OPR', 'OPT', 'OPiOS', { product: 'Opera Mini', family: null, engine: null }],
  },
  safari: {
    label: 'Safari',
    family: 'safari',
    engine: 'webkit',
    brands: [],
    match: [{ product: 'Version', with: ['Safari'], os: osIn('ios', 'ipados', 'macos'), fallback: true }],
  },
  'samsung-internet': { label: 'Samsung Internet', family: 'chromium', engine: 'blink', brands: [], match: ['SamsungBrowser'] },
  'uc-browser': { label: 'UC Browser', family: 'chromium', engine: 'blink', brands: [], match: ['UCBrowser'] },
  vivaldi: { label: 'Vivaldi', family: 'chromium', engine: 'blink', brands: [], match: ['Vivaldi'] },
  'yandex-browser': { label: 'Yandex Browser', family: 'chromium', engine: 'blink', brands: [], match: ['YaBrowser'] },
} as const satisfies Readonly<Record<string, BrowserRow>>;

export type BrowserId = keyof typeof rows;
export const BROWSERS: Readonly<Record<BrowserId, BrowserRow>> = rows;

/**
 * Top-level products that belong to no browser or context row but appear in ordinary
 * Chromium and WebKit User-Agents. Any other top-level product next to a generic Chrome token
 * marks an unlisted fork, so its identity is not reported as Chrome.
 */
export const NEUTRAL_PRODUCTS: readonly string[] = [
  'mozilla',
  'applewebkit',
  'gecko',
  'safari',
  'mobile',
  'version',
  'liff',
  'nettype',
  'language',
  'abi',
  'mmwebid',
  'mmwebsdk',
];
