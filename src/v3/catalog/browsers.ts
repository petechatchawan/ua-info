import type { BrowserId, EngineId } from '../constants';
import type { RowSpec } from '../core/match';
import type { BrowserFamily, BrowserMode } from '../types';

export interface BrowserSignal {
  readonly family?: BrowserFamily | null;
  readonly engine?: EngineId | null;
  readonly mode?: BrowserMode;
}

export interface BrowserRow extends RowSpec<BrowserId, BrowserSignal> {
  readonly family: BrowserFamily | null;
  readonly engine: EngineId | null;
  /** Sec-CH-UA brand names that identify this product. An empty list means no brand is known. */
  readonly brands: readonly string[];
  /** The brand names a generic identity, so a specific UA product is not replaced by it. */
  readonly brandIsFallback?: true;
}

export const BROWSERS: Readonly<Record<BrowserId, BrowserRow>> = {
  arc: { family: 'chromium', engine: 'blink', brands: [], match: ['Arc'] },
  brave: {
    family: 'chromium',
    engine: 'blink',
    brands: ['Brave'],
    match: ['Brave', { product: 'Brave', os: ['ios', 'ipados'], versionOptional: true, family: null }],
  },
  chrome: {
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
  chromium: { family: 'chromium', engine: 'blink', brands: [], match: ['Chromium'] },
  edge: {
    family: 'chromium',
    engine: 'blink',
    brands: ['Microsoft Edge'],
    match: ['Edg', 'EdgA', 'EdgiOS', { product: 'Edge', family: null, engine: null }],
  },
  firefox: { family: 'firefox', engine: 'gecko', brands: [], match: ['Firefox', 'FxiOS'] },
  'huawei-browser': { family: 'chromium', engine: 'blink', brands: [], match: ['HuaweiBrowser'] },
  'mi-browser': { family: 'chromium', engine: 'blink', brands: [], match: ['MiuiBrowser'] },
  opera: {
    family: 'chromium',
    engine: 'blink',
    brands: ['Opera'],
    match: ['OPR', 'OPT', 'OPiOS', { product: 'Opera Mini', family: null, engine: null }],
  },
  safari: {
    family: 'safari',
    engine: 'webkit',
    brands: [],
    match: [{ product: 'Version', with: ['Safari'], os: ['ios', 'ipados', 'macos'], fallback: true }],
  },
  'samsung-internet': { family: 'chromium', engine: 'blink', brands: [], match: ['SamsungBrowser'] },
  'uc-browser': { family: 'chromium', engine: 'blink', brands: [], match: ['UCBrowser'] },
  vivaldi: { family: 'chromium', engine: 'blink', brands: [], match: ['Vivaldi'] },
  'yandex-browser': { family: 'chromium', engine: 'blink', brands: [], match: ['YaBrowser'] },
};

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
