import { createCleanup, type Component } from './component';

export interface CodeExampleModel {
  readonly code: string;
}

export interface CodeExampleCallbacks {
  readonly onCopy: (value: string) => void;
}

export function createCodeExample(
  callbacks: CodeExampleCallbacks,
): Component<CodeExampleModel> {
  const cleanup = createCleanup();
  const element = document.createElement('section');
  element.className = 'ua-playground-code-panel';
  const header = document.createElement('div');
  header.className = 'ua-playground-code-panel__header';
  const heading = document.createElement('h2');
  heading.textContent = 'API Example';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'Copy example';
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  pre.append(code);
  header.append(heading, copy);
  element.append(header, pre);
  let current = '';
  cleanup.listen(copy, 'click', () => callbacks.onCopy(current));

  return {
    element,
    update(model) {
      current = model.code;
      code.textContent = model.code;
    },
    destroy: cleanup.destroy,
  };
}
