import { type Component } from './component';

export function createPrivacyNotice(): Component<void> {
  const element = document.createElement('aside');
  element.className = 'ua-playground-privacy';
  element.textContent = 'Detection happens locally in your browser. No data is uploaded.';
  return { element, update: () => undefined, destroy: () => undefined };
}
