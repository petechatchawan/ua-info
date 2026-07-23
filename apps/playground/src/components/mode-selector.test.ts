import { describe, expect, it, vi } from 'vitest';
import { createModeSelector } from './mode-selector';

describe('createModeSelector', () => {
  it('exposes selected tabs, panel relationships, and mode changes', () => {
    const onModeSelected = vi.fn();
    const component = createModeSelector({ onModeSelected });
    document.body.append(component.element);
    component.update({ mode: 'current' });

    const current = component.element.querySelector<HTMLButtonElement>('[data-mode="current"]')!;
    const manual = component.element.querySelector<HTMLButtonElement>('[data-mode="manual"]')!;

    expect(current.id).toBe('current-browser-tab');
    expect(current.getAttribute('aria-controls')).toBe('current-browser-panel');
    expect(current.getAttribute('aria-selected')).toBe('true');
    expect(manual.id).toBe('manual-user-agent-tab');
    expect(manual.getAttribute('aria-controls')).toBe('manual-user-agent-panel');

    manual.click();
    expect(onModeSelected).toHaveBeenCalledWith('manual');
  });
});
