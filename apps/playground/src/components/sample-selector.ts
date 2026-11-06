import { SAMPLE_CATEGORIES, USER_AGENT_SAMPLES } from '../samples';
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
    wrapper.dataset.testid = 'sample-selector';
    const label = document.createElement('span');
    label.id = 'user-agent-sample-label';
    label.className = 'ua-playground-sample-label';
    label.textContent = 'Sample User-Agent';
    wrapper.append(label);

    const groups = document.createElement('div');
    groups.className = 'ua-playground-sample-groups';
    groups.setAttribute('role', 'group');
    groups.setAttribute('aria-labelledby', 'user-agent-sample-label');
    const chips = new Map<string, HTMLButtonElement>();
    for (const category of SAMPLE_CATEGORIES) {
        const samples = USER_AGENT_SAMPLES.filter((item) => item.category === category);
        if (samples.length === 0) continue;
        const section = document.createElement('div');
        section.className = 'ua-playground-sample-group';
        const heading = document.createElement('h3');
        heading.textContent = category;
        const list = document.createElement('div');
        list.className = 'ua-playground-sample-chips';
        for (const sample of samples) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.dataset.sampleId = sample.id;
            chip.textContent = sample.label;
            chip.setAttribute('aria-pressed', 'false');
            cleanup.listen(chip, 'click', () => callbacks.onSampleSelected(sample.id));
            list.append(chip);
            chips.set(sample.id, chip);
        }
        section.append(heading, list);
        groups.append(section);
    }
    wrapper.append(groups);

    return {
        element: wrapper,
        update(model) {
            for (const [id, chip] of chips) {
                chip.setAttribute('aria-pressed', String(id === model.selectedSampleId));
            }
        },
        destroy: cleanup.destroy,
    };
}
