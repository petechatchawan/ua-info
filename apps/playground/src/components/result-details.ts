import type { ResultCardViewModel } from '../app/playground-view-model';
import { type Component } from './component';
import { createResultCard } from './result-card';

export function createResultDetails(): Component<readonly ResultCardViewModel[]> {
  const element = document.createElement('section');
  element.className = 'ua-playground-result-grid';
  element.setAttribute('aria-label', 'Detection details');
  const cards = new Map<string, ReturnType<typeof createResultCard>>();

  return {
    element,
    update(models) {
      const active = new Set(models.map((model) => model.id));
      for (const [id, card] of cards) {
        if (!active.has(id)) {
          card.destroy();
          card.element.remove();
          cards.delete(id);
        }
      }
      for (const model of models) {
        let card = cards.get(model.id);
        if (!card) {
          card = createResultCard(model.id);
          cards.set(model.id, card);
        }
        card.update(model);
        element.append(card.element);
      }
    },
    destroy() {
      for (const card of cards.values()) card.destroy();
      cards.clear();
    },
  };
}
