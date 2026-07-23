import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UAResult, UADetectionService } from '../services/ua-detection-service';
import { chromeResult, lineLiffResult } from '../tests/fixtures';
import { createManualDetectionEffect } from './manual-detection-effect';
import { createPlaygroundStore } from './playground-store';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

function createHarness() {
  const store = createPlaygroundStore();
  const detectionService: UADetectionService = {
    detectCurrent: vi.fn(),
    parseUserAgent: vi.fn().mockReturnValue(chromeResult),
    parseRequest: vi.fn().mockResolvedValue(lineLiffResult),
  };
  const effect = createManualDetectionEffect({ store, detectionService });
  return { store, detectionService, effect };
}

describe('createManualDetectionEffect', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('parses only the latest typed value after 300 ms', async () => {
    const { detectionService, effect } = createHarness();
    effect.changeUserAgent('first');
    vi.advanceTimersByTime(200);
    effect.changeUserAgent('second');
    vi.advanceTimersByTime(300);
    await vi.runAllTimersAsync();
    expect(detectionService.parseUserAgent).toHaveBeenCalledOnce();
    expect(detectionService.parseUserAgent).toHaveBeenCalledWith('second');
  });

  it('uses parseRequest for valid hints and parse for blank hints', async () => {
    const { detectionService, effect } = createHarness();
    effect.changeUserAgent('ua');
    effect.changeClientHints('{"sec-ch-ua-mobile":"?1"}');
    await effect.parseNow();
    expect(detectionService.parseRequest).toHaveBeenCalledOnce();
    effect.changeClientHints('');
    await effect.parseNow();
    expect(detectionService.parseUserAgent).toHaveBeenCalledOnce();
  });

  it('preserves the last valid result when hints are malformed', async () => {
    const { store, detectionService, effect } = createHarness();
    effect.changeUserAgent('ua');
    await effect.parseNow();
    effect.changeClientHints('{');
    await effect.parseNow();
    expect(store.getState().manual.result).toBe(chromeResult);
    expect(store.getState().manual.clientHints.error?.code).toBe('invalid-json');
    expect(detectionService.parseRequest).not.toHaveBeenCalled();
  });

  it('ignores an older asynchronous result', async () => {
    const first = deferred<UAResult>();
    const second = deferred<UAResult>();
    const { store, detectionService, effect } = createHarness();
    vi.mocked(detectionService.parseRequest)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    effect.changeUserAgent('first');
    effect.changeClientHints('{"sec-ch-ua-mobile":"?1"}');
    const firstRun = effect.parseNow();
    effect.changeUserAgent('second');
    const secondRun = effect.parseNow();
    second.resolve(lineLiffResult);
    await secondRun;
    first.resolve(chromeResult);
    await firstRun;
    expect(store.getState().manual.result).toBe(lineLiffResult);
  });

  it('selects samples immediately and reset cancels work', async () => {
    const { store, detectionService, effect } = createHarness();
    effect.selectSample('line-liff');
    await vi.runAllTimersAsync();
    expect(store.getState().manual.selectedSampleId).toBe('line-liff');
    expect(detectionService.parseRequest).toHaveBeenCalled();
    effect.changeUserAgent('pending');
    effect.reset();
    vi.runAllTimers();
    expect(store.getState().manual.userAgent).toBe('');
  });
});
