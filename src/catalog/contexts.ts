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
  wechat: { label: 'WeChat', type: 'in-app-browser', match: ['MicroMessenger'] },
} as const satisfies Readonly<Record<string, ContextRow>>;

/** The native app that hosts a page. The User-Agent names these. */
export type AppId = keyof typeof rows;
/** What the page runs as. `liff` and `pwa` come from runtime evidence, not from a User-Agent. */
export type ContextId = AppId | 'liff' | 'pwa';

export const CONTEXTS: Readonly<Record<AppId, ContextRow>> = rows;
