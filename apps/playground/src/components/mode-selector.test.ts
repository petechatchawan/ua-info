import { describe, expect, it, vi } from 'vitest';
import { createModeSelector } from './mode-selector';

describe('createModeSelector', () => {
  it('exposes selected tabs and emits mode changes', () => {
    const onModeSelected = vi.fn();
    const component = createModeSelector({ onModeSelected });
    document.body.append(component.element);
    component.update({ mode: 'current' });
    const current = component.element.querySelector<HTMLButtonElement>('[data-mode="current"]')!;
    const manual = component.element.querySelector<HTMLButtonElement>('[data-mode="manual"]')!;
    expect(current.getAttribute('aria-selected')).toBe('true');
    manual.click();
    expect(onModeSelected).toHaveBeenCalledWith('manual');
  });
});
