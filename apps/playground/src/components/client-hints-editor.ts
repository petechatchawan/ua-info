import type { ClientHintsInputError } from '../app/playground-state';
import { createCleanup, type Component } from './component';

export interface ClientHintsEditorModel {
  readonly expanded: boolean;
  readonly text: string;
  readonly error: ClientHintsInputError | null;
}

export interface ClientHintsEditorCallbacks {
  readonly onExpandedChanged: (expanded: boolean) => void;
  readonly onTextChanged: (value: string) => void;
  readonly onReset: () => void;
}

export function createClientHintsEditor(
  callbacks: ClientHintsEditorCallbacks,
): Component<ClientHintsEditorModel> {
  const cleanup = createCleanup();
  const details = document.createElement('details');
  details.className = 'ua-playground-client-hints';
  const summary = document.createElement('summary');
  summary.textContent = 'Advanced Client Hints';
  const field = document.createElement('div');
  field.className = 'ua-playground-field';
  const label = document.createElement('label');
  label.htmlFor = 'client-hints-json';
  label.textContent = 'Client Hints headers JSON';
  const textarea = document.createElement('textarea');
  textarea.id = 'client-hints-json';
  textarea.dataset.testid = 'client-hints-json';
  textarea.rows = 8;
  textarea.spellcheck = false;
  textarea.placeholder = '{\n  "sec-ch-ua-platform": "\\"Android\\""\n}';
  const error = document.createElement('p');
  error.className = 'ua-playground-error';
  error.setAttribute('role', 'alert');
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Reset Client Hints';

  cleanup.listen(details, 'toggle', () => callbacks.onExpandedChanged(details.open));
  cleanup.listen(textarea, 'input', () => callbacks.onTextChanged(textarea.value));
  cleanup.listen(reset, 'click', callbacks.onReset);
  field.append(label, textarea, error, reset);
  details.append(summary, field);

  return {
    element: details,
    update(model) {
      if (details.open !== model.expanded) details.open = model.expanded;
      if (textarea.value !== model.text) textarea.value = model.text;
      error.textContent = model.error?.message ?? '';
      error.hidden = model.error === null;
      reset.disabled = model.text.length === 0;
    },
    destroy: cleanup.destroy,
  };
}
