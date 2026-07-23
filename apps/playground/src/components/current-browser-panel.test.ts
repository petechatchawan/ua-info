import { describe, expect, it, vi } from 'vitest';
import { createCurrentBrowserPanel } from './current-browser-panel';

describe('createCurrentBrowserPanel', () => {
  it('renders loading, error, and retry semantics', () => {
    const onRetry = vi.fn();
    const panel = createCurrentBrowserPanel({ onRetry });
    panel.update({ status: 'loading' });
    expect(panel.element.querySelector('[role="status"]')?.textContent).toContain('Detecting');
    panel.update({ status: 'error', message: 'denied' });
    expect(panel.element.querySelector('[role="alert"]')?.textContent).toContain('failed');
    panel.element.querySelector<HTMLButtonElement>('button')?.click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
