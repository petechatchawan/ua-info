import type { CurrentDetectionState } from '../app/playground-state';
import { createCleanup, type Component } from './component';

export interface CurrentBrowserPanelCallbacks {
  readonly onRetry: () => void;
}

export function createCurrentBrowserPanel(
  callbacks: CurrentBrowserPanelCallbacks,
): Component<CurrentDetectionState> {
  const cleanup = createCleanup();
  const element = document.createElement('section');
  element.id = 'current-browser-panel';
  element.className = 'ua-playground-panel ua-playground-input-panel';
  element.setAttribute('role', 'tabpanel');

  const heading = document.createElement('h2');
  heading.textContent = 'Current Browser';
  const message = document.createElement('p');
  const detail = document.createElement('p');
  detail.className = 'ua-playground-muted';
  const action = document.createElement('button');
  action.type = 'button';
  cleanup.listen(action, 'click', callbacks.onRetry);
  element.append(heading, message, detail, action);

  return {
    element,
    update(model) {
      message.removeAttribute('role');
      detail.hidden = true;
      action.hidden = false;
      if (model.status === 'idle') {
        message.textContent = 'Inspect this browser using User-Agent, Client Hints, and runtime signals.';
        action.textContent = 'Detect current browser';
      } else if (model.status === 'loading') {
        message.textContent = 'Detecting current browser…';
        message.setAttribute('role', 'status');
        action.hidden = true;
      } else if (model.status === 'error') {
        message.textContent =
          'Current browser detection failed. You can still use Manual User-Agent mode.';
        message.setAttribute('role', 'alert');
        detail.textContent = model.message;
        detail.hidden = false;
        action.textContent = 'Retry detection';
      } else {
        message.textContent = 'Detection complete.';
        message.setAttribute('role', 'status');
        action.textContent = 'Refresh detection';
      }
    },
    destroy: cleanup.destroy,
  };
}
