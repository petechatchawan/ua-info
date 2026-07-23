import type { ManualPlaygroundState } from '../app/playground-state';
import { createCleanup, type Component } from './component';
import { createSampleSelector } from './sample-selector';
import { createClientHintsEditor } from './client-hints-editor';

export interface ManualUserAgentPanelCallbacks {
  readonly onUserAgentChanged: (value: string) => void;
  readonly onSampleSelected: (sampleId: string) => void;
  readonly onParseNow: () => void;
  readonly onReset: () => void;
  readonly onClientHintsExpandedChanged: (expanded: boolean) => void;
  readonly onClientHintsChanged: (value: string) => void;
  readonly onClientHintsReset: () => void;
}

export interface ManualUserAgentPanel extends Component<ManualPlaygroundState> {
  focusInput(): void;
}

export function createManualUserAgentPanel(
  callbacks: ManualUserAgentPanelCallbacks,
): ManualUserAgentPanel {
  const cleanup = createCleanup();
  const element = document.createElement('section');
  element.id = 'manual-user-agent-panel';
  element.className = 'ua-playground-panel ua-playground-input-panel';
  element.setAttribute('role', 'tabpanel');
  element.setAttribute('aria-labelledby', 'manual-user-agent-tab');

  const heading = document.createElement('h2');
  heading.textContent = 'Manual User-Agent';
  const sample = createSampleSelector({ onSampleSelected: callbacks.onSampleSelected });

  const field = document.createElement('div');
  field.className = 'ua-playground-field';
  const label = document.createElement('label');
  label.htmlFor = 'manual-user-agent';
  label.textContent = 'User-Agent';
  const textarea = document.createElement('textarea');
  textarea.id = 'manual-user-agent';
  textarea.dataset.testid = 'manual-user-agent';
  textarea.rows = 6;
  textarea.spellcheck = false;
  textarea.placeholder = 'Paste a User-Agent string';

  const clientHints = createClientHintsEditor({
    onExpandedChanged: callbacks.onClientHintsExpandedChanged,
    onTextChanged: callbacks.onClientHintsChanged,
    onReset: callbacks.onClientHintsReset,
  });

  const actions = document.createElement('div');
  actions.className = 'ua-playground-actions';
  const parse = document.createElement('button');
  parse.type = 'button';
  parse.textContent = 'Parse now';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'ua-playground-button-secondary';
  reset.textContent = 'Reset';
  actions.append(parse, reset);

  const status = document.createElement('p');
  status.className = 'ua-playground-status';
  status.setAttribute('aria-live', 'polite');

  cleanup.listen(textarea, 'input', () => callbacks.onUserAgentChanged(textarea.value));
  cleanup.listen(textarea, 'keydown', (event) => {
    const keyboard = event as KeyboardEvent;
    if (keyboard.key === 'Enter' && (keyboard.ctrlKey || keyboard.metaKey)) {
      keyboard.preventDefault();
      callbacks.onParseNow();
    }
  });
  cleanup.listen(parse, 'click', callbacks.onParseNow);
  cleanup.listen(reset, 'click', callbacks.onReset);
  cleanup.add(sample.destroy);
  cleanup.add(clientHints.destroy);

  field.append(label, textarea);
  element.append(heading, sample.element, field, clientHints.element, actions, status);

  return {
    element,
    update(model) {
      if (textarea.value !== model.userAgent) textarea.value = model.userAgent;
      sample.update({ selectedSampleId: model.selectedSampleId });
      clientHints.update(model.clientHints);
      parse.disabled = model.userAgent.trim().length === 0 || model.parseStatus === 'parsing';
      reset.disabled =
        model.userAgent.length === 0 &&
        model.clientHints.text.length === 0 &&
        model.result === null;
      status.removeAttribute('role');
      if (model.clientHints.error) {
        status.textContent = 'Fix the Client Hints JSON before parsing.';
        status.setAttribute('role', 'alert');
      } else if (model.errorMessage) {
        status.textContent = model.errorMessage;
        status.setAttribute('role', 'alert');
      } else if (model.parseStatus === 'scheduled') {
        status.textContent = 'Waiting for input…';
      } else if (model.parseStatus === 'parsing') {
        status.textContent = 'Parsing…';
        status.setAttribute('role', 'status');
      } else if (model.parseStatus === 'success') {
        status.textContent = 'Parsed successfully.';
        status.setAttribute('role', 'status');
      } else {
        status.textContent = '';
      }
    },
    focusInput: () => textarea.focus(),
    destroy: cleanup.destroy,
  };
}
