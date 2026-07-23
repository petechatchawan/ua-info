import type { ResultCardViewModel } from '../app/playground-view-model';
import { type Component } from './component';

export function createResultCard(id: string): Component<ResultCardViewModel> {
  const element = document.createElement('article');
  element.className = 'ua-playground-result-card';
  element.dataset.card = id;
  const heading = document.createElement('h3');
  const list = document.createElement('dl');
  element.append(heading, list);

  return {
    element,
    update(model) {
      heading.textContent = model.title;
      list.replaceChildren();
      for (const item of model.rows) {
        const term = document.createElement('dt');
        term.textContent = item.label;
        const value = document.createElement('dd');
        value.textContent = item.value;
        value.dataset.detected = String(item.detected);
        list.append(term, value);
      }
    },
    destroy: () => undefined,
  };
}
