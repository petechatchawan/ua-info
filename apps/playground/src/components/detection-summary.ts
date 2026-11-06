import type { DetectionSummaryViewModel } from '../app/playground-view-model';
import { NOT_DETECTED } from '../app/playground-view-model';
import { type Component } from './component';

const fields: ReadonlyArray<readonly [keyof DetectionSummaryViewModel, string]> = [
    ['browser', 'Browser'],
    ['mode', 'Mode'],
    ['contextHost', 'Host app'],
    ['contextSurface', 'Runs as'],
    ['os', 'Operating System'],
    ['device', 'Device'],
];

export function createDetectionSummary(): Component<DetectionSummaryViewModel> {
    const element = document.createElement('section');
    element.className = 'ua-playground-summary';
    element.dataset.testid = 'detection-summary';
    const heading = document.createElement('h2');
    heading.textContent = 'Identity Summary';
    const list = document.createElement('dl');
    const values = new Map<keyof DetectionSummaryViewModel, HTMLElement>();
    for (const [key, label] of fields) {
        const term = document.createElement('dt');
        term.textContent = label;
        const value = document.createElement('dd');
        value.dataset.field = key;
        list.append(term, value);
        values.set(key, value);
    }
    element.append(heading, list);

    return {
        element,
        update(model) {
            for (const [key] of fields) {
                const value = values.get(key)!;
                value.textContent = model[key];
                value.dataset.detected = String(model[key] !== NOT_DETECTED);
            }
        },
        destroy: () => undefined,
    };
}
