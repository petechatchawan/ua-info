import type { ContextId } from '../constants';
import type { RowSpec } from '../core/match';
import type { ContextType } from '../types';

export type UserAgentContextId = Exclude<ContextId, 'liff' | 'pwa'>;

export interface ContextRow extends RowSpec<UserAgentContextId> {
  readonly type: ContextType;
}

export const CONTEXTS: Readonly<Record<UserAgentContextId, ContextRow>> = {
  facebook: { type: 'in-app-browser', match: [{ product: 'FBAV', fallback: true }] },
  instagram: { type: 'in-app-browser', match: ['Instagram'] },
  line: { type: 'in-app-browser', match: ['Line'] },
  messenger: {
    type: 'in-app-browser',
    beats: ['facebook'],
    match: [{ product: 'FBAN', valueIs: ['MessengerForiOS', 'Orca-Android'], versionFrom: 'FBAV' }],
  },
  wechat: { type: 'in-app-browser', match: ['MicroMessenger'] },
};
