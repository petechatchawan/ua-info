import type { PlaygroundNotification } from '../app/playground-state';
import { type Component } from './component';

export interface StatusMessageModel {
  readonly notification: PlaygroundNotification | null;
}

export function createStatusMessage(): Component<StatusMessageModel> {
  const element = document.createElement('div');
  element.className = 'ua-playground-global-status';
  element.setAttribute('aria-live', 'polite');

  return {
    element,
    update(model) {
      element.textContent = model.notification?.message ?? '';
      element.dataset.kind = model.notification?.kind ?? 'none';
      element.setAttribute(
        'role',
        model.notification?.kind === 'error' ? 'alert' : 'status',
      );
      element.hidden = model.notification === null;
    },
    destroy: () => undefined,
  };
}
