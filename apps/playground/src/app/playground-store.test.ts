import { describe, expect, it, vi } from 'vitest';
import { createPlaygroundStore } from './playground-store';

describe('createPlaygroundStore', () => {
  it('notifies only when the state reference changes', () => {
    const store = createPlaygroundStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.dispatch({ type: 'mode-selected', mode: 'current' });
    store.dispatch({ type: 'mode-selected', mode: 'manual' });
    unsubscribe();
    store.dispatch({ type: 'mode-selected', mode: 'current' });
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]?.[0].mode).toBe('manual');
  });
});
