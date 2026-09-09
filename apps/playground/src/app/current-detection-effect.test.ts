import { describe, expect, it, vi } from 'vitest';
import type { UAInfo, UADetectionService } from '../services/ua-detection-service';
import { chromeResult, lineLiffResult } from '../tests/fixtures';
import { createCurrentDetectionEffect } from './current-detection-effect';
import { createPlaygroundStore } from './playground-store';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function service(detect: UADetectionService['detect']): UADetectionService {
  return { detect, parseUserAgent: vi.fn(), parseRequest: vi.fn() };
}

describe('createCurrentDetectionEffect', () => {
  it('dispatches loading then success', async () => {
    const store = createPlaygroundStore();
    const effect = createCurrentDetectionEffect({
      store,
      detectionService: service(vi.fn().mockResolvedValue(chromeResult)),
    });
    await effect.detect();
    expect(store.getState().current).toEqual({ status: 'success', result: chromeResult });
  });

  it('maps failures to readable state', async () => {
    const store = createPlaygroundStore();
    const effect = createCurrentDetectionEffect({
      store,
      detectionService: service(vi.fn().mockRejectedValue(new Error('permission denied'))),
    });
    await effect.detect();
    expect(store.getState().current).toEqual({ status: 'error', message: 'permission denied' });
  });

  it('ignores stale and post-destroy completions', async () => {
    const first = deferred<UAInfo>();
    const second = deferred<UAInfo>();
    const detect = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const store = createPlaygroundStore();
    const effect = createCurrentDetectionEffect({ store, detectionService: service(detect) });
    const firstRun = effect.detect();
    const secondRun = effect.detect();
    second.resolve(lineLiffResult);
    await secondRun;
    first.resolve(chromeResult);
    await firstRun;
    expect(store.getState().current).toEqual({ status: 'success', result: lineLiffResult });
    const third = deferred<UAInfo>();
    detect.mockReturnValueOnce(third.promise);
    const thirdRun = effect.detect();
    effect.destroy();
    third.resolve(chromeResult);
    await thirdRun;
    expect(store.getState().current).toEqual({ status: 'loading' });
  });
});
