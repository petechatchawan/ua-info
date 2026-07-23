import { createCleanup, type Component } from './component';

export interface JsonViewerModel {
  readonly json: string;
}

export interface JsonViewerCallbacks {
  readonly onCopy: (value: string) => void;
}

export function createJsonViewer(
  callbacks: JsonViewerCallbacks,
): Component<JsonViewerModel> {
  const cleanup = createCleanup();
  const element = document.createElement('section');
  element.className = 'ua-playground-code-panel';
  const header = document.createElement('div');
  header.className = 'ua-playground-code-panel__header';
  const heading = document.createElement('h2');
  heading.textContent = 'Raw JSON';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'Copy JSON';
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.dataset.testid = 'raw-json';
  pre.append(code);
  header.append(heading, copy);
  element.append(header, pre);
  let current = '';
  cleanup.listen(copy, 'click', () => callbacks.onCopy(current));

  return {
    element,
    update(model) {
      current = model.json;
      code.textContent = model.json;
    },
    destroy: cleanup.destroy,
  };
}
