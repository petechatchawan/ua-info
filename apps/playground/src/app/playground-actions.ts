import type { UAResult } from '../services/ua-detection-service';
import type {
  ClientHintsInputError,
  PlaygroundMode,
  PlaygroundNotification,
} from './playground-state';

export type PlaygroundAction =
  | { readonly type: 'mode-selected'; readonly mode: PlaygroundMode }
  | { readonly type: 'current-detection-requested' }
  | { readonly type: 'current-detection-succeeded'; readonly result: UAResult }
  | { readonly type: 'current-detection-failed'; readonly message: string }
  | { readonly type: 'manual-user-agent-changed'; readonly value: string }
  | { readonly type: 'manual-parse-requested' }
  | { readonly type: 'manual-parse-succeeded'; readonly result: UAResult }
  | { readonly type: 'manual-parse-failed'; readonly message: string }
  | {
      readonly type: 'sample-selected';
      readonly sampleId: string;
      readonly userAgent: string;
      readonly clientHintsText: string;
    }
  | { readonly type: 'client-hints-expanded'; readonly expanded: boolean }
  | { readonly type: 'client-hints-changed'; readonly value: string }
  | { readonly type: 'client-hints-valid' }
  | { readonly type: 'client-hints-invalid'; readonly error: ClientHintsInputError }
  | { readonly type: 'manual-reset' }
  | { readonly type: 'notification-shown'; readonly notification: PlaygroundNotification }
  | { readonly type: 'notification-cleared' };
