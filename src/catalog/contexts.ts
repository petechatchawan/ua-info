import type { RowSpec } from '../core/match';
import type { ContextType } from '../types';

export interface ContextRow extends RowSpec<string> {
  readonly label: string;
  readonly type: ContextType;
}

const rows = {
  facebook: { label: 'Facebook', type: 'in-app-browser', match: [{ product: 'FBAV', fallback: true }] },
  instagram: { label: 'Instagram', type: 'in-app-browser', match: ['Instagram'] },
  line: { label: 'LINE', type: 'in-app-browser', match: ['Line'] },
  messenger: {
    label: 'Messenger',
    type: 'in-app-browser',
    beats: ['facebook'],
    match: [{ product: 'FBAN', valueIs: ['MessengerForiOS', 'Orca-Android'], versionFrom: 'FBAV' }],
  },
  tiktok: {
    label: 'TikTok',
    type: 'in-app-browser',
    // `musical_ly_2022803040` is a build code, not a version. The explicit `app_version` token wins
    // when the client sends it; the token suffix stays the fallback for the older `musical_ly_28.3.4`.
    match: [
      { words: 'musical_ly*', versionPrefer: 'app_version' },
      { words: 'tiktok*', versionPrefer: 'app_version' },
      'BytedanceWebview',
    ],
  },
  wechat: { label: 'WeChat', type: 'in-app-browser', match: ['MicroMessenger'] },
} as const satisfies Readonly<Record<string, ContextRow>>;

/** The native app that hosts a page. The User-Agent names these. */
export type AppId = keyof typeof rows;
/** What the page runs as. `liff` and `pwa` come from runtime evidence, not from a User-Agent. */
export type ContextId = AppId | 'liff' | 'pwa';

export const CONTEXTS: Readonly<Record<AppId, ContextRow>> = rows;
