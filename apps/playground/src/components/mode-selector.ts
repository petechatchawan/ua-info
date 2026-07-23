import type { PlaygroundMode } from '../app/playground-state';
import { createCleanup, type Component } from './component';

export interface ModeSelectorModel {
  readonly mode: PlaygroundMode;
}

export interface ModeSelectorCallbacks {
  readonly onModeSelected: (mode: PlaygroundMode) => void;
}

export function createModeSelector(
  callbacks: ModeSelectorCallbacks,
): Component<ModeSelectorModel> {
  const cleanup = createCleanup();
  const element = document.createElement('div');
  element.className = 'ua-playground-mode-selector';
  element.setAttribute('role', 'tablist');
  element.setAttribute('aria-label', 'Detection mode');

  const current = document.createElement('button');
  current.type = 'button';
  current.dataset.mode = 'current';
  current.setAttribute('role', 'tab');
  current.setAttribute('aria-controls', 'current-browser-panel');
  current.textContent = 'Current Browser';

  const manual = document.createElement('button');
  manual.type = 'button';
  manual.dataset.mode = 'manual';
  manual.setAttribute('role', 'tab');
  manual.setAttribute('aria-controls', 'manual-user-agent-panel');
  manual.textContent = 'Manual User-Agent';

  const buttons = [current, manual] as const;
  cleanup.listen(current, 'click', () => callbacks.onModeSelected('current'));
  cleanup.listen(manual, 'click', () => callbacks.onModeSelected('manual'));
  cleanup.listen(element, 'keydown', (event) => {
    const keyboard = event as KeyboardEvent;
    if (keyboard.key !== 'ArrowLeft' && keyboard.key !== 'ArrowRight') return;
    keyboard.preventDefault();
    const active = document.activeElement === current ? 0 : 1;
    const next = active === 0 ? 1 : 0;
    buttons[next].focus();
    callbacks.onModeSelected(next === 0 ? 'current' : 'manual');
  });
  element.append(current, manual);

  return {
    element,
    update(model) {
      current.setAttribute('aria-selected', String(model.mode === 'current'));
      manual.setAttribute('aria-selected', String(model.mode === 'manual'));
      current.tabIndex = model.mode === 'current' ? 0 : -1;
      manual.tabIndex = model.mode === 'manual' ? 0 : -1;
    },
    destroy: cleanup.destroy,
  };
}
