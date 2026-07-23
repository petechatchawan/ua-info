import type { PlaygroundAction } from './playground-actions';
import {
  createInitialManualState,
  type PlaygroundState,
} from './playground-state';

export function reducePlaygroundState(
  state: PlaygroundState,
  action: PlaygroundAction,
): PlaygroundState {
  switch (action.type) {
    case 'mode-selected':
      return action.mode === state.mode ? state : { ...state, mode: action.mode };
    case 'current-detection-requested':
      return { ...state, current: { status: 'loading' } };
    case 'current-detection-succeeded':
      return { ...state, current: { status: 'success', result: action.result } };
    case 'current-detection-failed':
      return { ...state, current: { status: 'error', message: action.message } };
    case 'manual-user-agent-changed': {
      const empty = action.value.trim().length === 0;
      return {
        ...state,
        manual: {
          ...state.manual,
          userAgent: action.value,
          selectedSampleId: null,
          parseStatus: empty ? 'idle' : 'scheduled',
          result: empty ? null : state.manual.result,
          errorMessage: null,
        },
      };
    }
    case 'manual-parse-requested':
      return {
        ...state,
        manual: { ...state.manual, parseStatus: 'parsing', errorMessage: null },
      };
    case 'manual-parse-succeeded':
      return {
        ...state,
        manual: {
          ...state.manual,
          parseStatus: 'success',
          result: action.result,
          errorMessage: null,
        },
      };
    case 'manual-parse-failed':
      return {
        ...state,
        manual: {
          ...state.manual,
          parseStatus: 'error',
          errorMessage: action.message,
        },
      };
    case 'sample-selected':
      return {
        ...state,
        manual: {
          ...state.manual,
          userAgent: action.userAgent,
          selectedSampleId: action.sampleId,
          clientHints: {
            ...state.manual.clientHints,
            text: action.clientHintsText,
            error: null,
          },
          parseStatus: 'scheduled',
          errorMessage: null,
        },
      };
    case 'client-hints-expanded':
      return {
        ...state,
        manual: {
          ...state.manual,
          clientHints: { ...state.manual.clientHints, expanded: action.expanded },
        },
      };
    case 'client-hints-changed':
      return {
        ...state,
        manual: {
          ...state.manual,
          clientHints: {
            ...state.manual.clientHints,
            text: action.value,
            error: null,
          },
          parseStatus: state.manual.userAgent.trim() ? 'scheduled' : 'idle',
          errorMessage: null,
        },
      };
    case 'client-hints-valid':
      return state.manual.clientHints.error === null
        ? state
        : {
            ...state,
            manual: {
              ...state.manual,
              clientHints: { ...state.manual.clientHints, error: null },
            },
          };
    case 'client-hints-invalid':
      return {
        ...state,
        manual: {
          ...state.manual,
          parseStatus: 'error',
          clientHints: { ...state.manual.clientHints, error: action.error },
        },
      };
    case 'manual-reset':
      return { ...state, manual: createInitialManualState() };
    case 'notification-shown':
      return { ...state, notification: action.notification };
    case 'notification-cleared':
      return state.notification === null ? state : { ...state, notification: null };
  }
}
