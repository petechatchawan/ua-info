import type { UAResult } from '../services/ua-detection-service';

export type PlaygroundMode = 'current' | 'manual';

export type CurrentDetectionState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly result: UAResult }
  | { readonly status: 'error'; readonly message: string };

export type ManualParseStatus = 'idle' | 'scheduled' | 'parsing' | 'success' | 'error';

export type ClientHintsInputErrorCode =
  | 'too-large'
  | 'invalid-json'
  | 'invalid-root'
  | 'dangerous-key'
  | 'invalid-value';

export interface ClientHintsInputError {
  readonly code: ClientHintsInputErrorCode;
  readonly message: string;
}

export interface ManualPlaygroundState {
  readonly userAgent: string;
  readonly selectedSampleId: string | null;
  readonly clientHints: {
    readonly expanded: boolean;
    readonly text: string;
    readonly error: ClientHintsInputError | null;
  };
  readonly parseStatus: ManualParseStatus;
  readonly result: UAResult | null;
  readonly errorMessage: string | null;
}

export interface PlaygroundNotification {
  readonly kind: 'success' | 'error';
  readonly message: string;
}

export interface PlaygroundState {
  readonly mode: PlaygroundMode;
  readonly current: CurrentDetectionState;
  readonly manual: ManualPlaygroundState;
  readonly notification: PlaygroundNotification | null;
}

export function createInitialManualState(): ManualPlaygroundState {
  return {
    userAgent: '',
    selectedSampleId: null,
    clientHints: { expanded: false, text: '', error: null },
    parseStatus: 'idle',
    result: null,
    errorMessage: null,
  };
}

export function createInitialPlaygroundState(): PlaygroundState {
  return {
    mode: 'current',
    current: { status: 'idle' },
    manual: createInitialManualState(),
    notification: null,
  };
}
