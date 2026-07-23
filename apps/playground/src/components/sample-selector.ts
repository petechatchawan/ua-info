import {
  SAMPLE_CATEGORIES,
  USER_AGENT_SAMPLES,
} from '../samples';
import { createCleanup, type Component } from './component';

export interface SampleSelectorModel {
  readonly selectedSampleId: string | null;
}

export interface SampleSelectorCallbacks {
  readonly onSampleSelected: (sampleId: string) => void;
}

export function createSampleSelector(
  callbacks: SampleSelectorCallbacks,
): Component<SampleSelectorModel> {
  const cleanup = createCleanup();
  const wrapper = document.createElement('div');
  wrapper.className = 'ua-playground-field';
  const label = document.createElement('label');
  label.htmlFor = 'user-agent-sample';
  label.textContent = 'Sample User-Agent';
  const select = document.createElement('select');
  select.id = 'user-agent-sample';
  select.dataset.testid = 'sample-selector';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Choose a sample';
  select.append(placeholder);

  for (const category of SAMPLE_CATEGORIES) {
    const group = document.createElement('optgroup');
    group.label = category;
    for (const sample of USER_AGENT_SAMPLES.filter((item) => item.category === category)) {
      const option = document.createElement('option');
      option.value = sample.id;
      option.textContent = sample.label;
      group.append(option);
    }
    select.append(group);
  }

  cleanup.listen(select, 'change', () => {
    if (select.value) callbacks.onSampleSelected(select.value);
  });
  wrapper.append(label, select);

  return {
    element: wrapper,
    update(model) {
      select.value = model.selectedSampleId ?? '';
    },
    destroy: cleanup.destroy,
  };
}
