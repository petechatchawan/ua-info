import { describe, expect, it, vi } from 'vitest';
import { createCleanup } from './component';

describe('createCleanup', () => {
  it('removes listeners and runs late disposers immediately', () => {
    const button = document.createElement('button');
    const handler = vi.fn();
    const cleanup = createCleanup();
    cleanup.listen(button, 'click', handler);
    button.click();
    cleanup.destroy();
    button.click();
    const late = vi.fn();
    cleanup.add(late);
    expect(handler).toHaveBeenCalledOnce();
    expect(late).toHaveBeenCalledOnce();
  });
});
