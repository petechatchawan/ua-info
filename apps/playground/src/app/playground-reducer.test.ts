import { describe, expect, it } from 'vitest';
import { chromeResult } from '../tests/fixtures';
import { reducePlaygroundState } from './playground-reducer';
import { createInitialPlaygroundState } from './playground-state';

describe('reducePlaygroundState', () => {
  it('returns the same reference for the selected mode', () => {
    const state = createInitialPlaygroundState();
    expect(reducePlaygroundState(state, { type: 'mode-selected', mode: 'current' })).toBe(state);
  });

  it('preserves the latest valid result for invalid Client Hints', () => {
    const success = reducePlaygroundState(createInitialPlaygroundState(), {
      type: 'manual-parse-succeeded',
      result: chromeResult,
    });
    const invalid = reducePlaygroundState(success, {
      type: 'client-hints-invalid',
      error: { code: 'invalid-json', message: 'bad json' },
    });
    expect(invalid.manual.result).toBe(chromeResult);
    expect(invalid.manual.clientHints.error?.code).toBe('invalid-json');
  });

  it('clears manual state without changing current detection', () => {
    const current = reducePlaygroundState(createInitialPlaygroundState(), {
      type: 'current-detection-succeeded',
      result: chromeResult,
    });
    const typed = reducePlaygroundState(current, {
      type: 'manual-user-agent-changed',
      value: 'test',
    });
    const reset = reducePlaygroundState(typed, { type: 'manual-reset' });
    expect(reset.current).toEqual({ status: 'success', result: chromeResult });
    expect(reset.manual.userAgent).toBe('');
  });
});
