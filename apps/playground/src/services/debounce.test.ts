import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebounce } from './debounce';

describe('createDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs only the latest callback after the delay', () => {
    const first = vi.fn();
    const second = vi.fn();
    const debounce = createDebounce(300);
    debounce.schedule(first);
    vi.advanceTimersByTime(200);
    debounce.schedule(second);
    vi.advanceTimersByTime(299);
    expect(second).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('flushes, cancels, and destroys pending callbacks', () => {
    const flushed = vi.fn();
    const canceled = vi.fn();
    const destroyed = vi.fn();
    const debounce = createDebounce(300);
    debounce.schedule(flushed);
    debounce.flush();
    debounce.schedule(canceled);
    debounce.cancel();
    debounce.schedule(destroyed);
    debounce.destroy();
    vi.runAllTimers();
    expect(flushed).toHaveBeenCalledOnce();
    expect(canceled).not.toHaveBeenCalled();
    expect(destroyed).not.toHaveBeenCalled();
  });
});
