import { describe, expect, it, vi } from 'vitest';
import { chromeResult } from '../tests/fixtures';
import { createPlaygroundApp } from './create-playground-app';

function service() {
  return {
    detectCurrent: vi.fn().mockResolvedValue(chromeResult),
    parseUserAgent: vi.fn().mockReturnValue(chromeResult),
    parseRequest: vi.fn().mockResolvedValue(chromeResult),
  };
}

describe('createPlaygroundApp', () => {
  it('keeps one shell and starts current detection once', async () => {
    const detectionService = service();
    const app = createPlaygroundApp({ detectionService });
    const shell = app.element;
    app.start();
    app.start();
    await Promise.resolve();
    app.selectMode('manual');
    expect(app.element).toBe(shell);
    expect(detectionService.detectCurrent).toHaveBeenCalledOnce();
    expect(app.element.querySelector('#manual-user-agent-panel')?.hasAttribute('hidden')).toBe(false);
    app.destroy();
  });

  it('reports clipboard failure without losing results', async () => {
    const app = createPlaygroundApp({
      detectionService: service(),
      clipboardService: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    app.start();
    await Promise.resolve();
    app.element.querySelector<HTMLButtonElement>('.ua-playground-code-panel button')?.click();
    await Promise.resolve();
    expect(app.element.textContent).toContain('Unable to copy');
    expect(app.element.querySelector('[data-testid="detection-summary"]')).not.toBeNull();
    app.destroy();
  });
});
