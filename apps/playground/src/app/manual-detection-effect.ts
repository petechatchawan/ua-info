import { findUserAgentSample } from '../samples';
import { parseClientHintsInput } from '../services/client-hints-input';
import { createDebounce } from '../services/debounce';
import type { UADetectionService } from '../services/ua-detection-service';
import type { PlaygroundStore } from './playground-store';

export interface ManualDetectionEffect {
  changeUserAgent(value: string): void;
  changeClientHints(value: string): void;
  setClientHintsExpanded(expanded: boolean): void;
  selectSample(sampleId: string): void;
  parseNow(): Promise<void>;
  reset(): void;
  destroy(): void;
}

export function createManualDetectionEffect(input: {
  readonly store: PlaygroundStore;
  readonly detectionService: UADetectionService;
}): ManualDetectionEffect {
  const debounce = createDebounce(300);
  let generation = 0;
  let destroyed = false;

  const schedule = (): void => {
    const state = input.store.getState().manual;
    if (!state.userAgent.trim()) {
      debounce.cancel();
      return;
    }
    debounce.schedule(() => {
      void effect.parseNow();
    });
  };

  const effect: ManualDetectionEffect = {
    changeUserAgent(value) {
      generation += 1;
      input.store.dispatch({ type: 'manual-user-agent-changed', value });
      schedule();
    },
    changeClientHints(value) {
      generation += 1;
      input.store.dispatch({ type: 'client-hints-changed', value });
      schedule();
    },
    setClientHintsExpanded(expanded) {
      input.store.dispatch({ type: 'client-hints-expanded', expanded });
    },
    selectSample(sampleId) {
      generation += 1;
      debounce.cancel();
      const sample = findUserAgentSample(sampleId);
      if (!sample) return;
      input.store.dispatch({
        type: 'sample-selected',
        sampleId: sample.id,
        userAgent: sample.userAgent,
        clientHintsText: sample.clientHints
          ? JSON.stringify(sample.clientHints, null, 2)
          : '',
      });
      void effect.parseNow();
    },
    async parseNow() {
      debounce.cancel();
      if (destroyed) return;
      const requestGeneration = ++generation;
      const snapshot = input.store.getState().manual;
      if (!snapshot.userAgent.trim()) return;

      const parsedHints = parseClientHintsInput(snapshot.clientHints.text);
      if (!parsedHints.ok) {
        input.store.dispatch({ type: 'client-hints-invalid', error: parsedHints.error });
        return;
      }
      input.store.dispatch({ type: 'client-hints-valid' });
      input.store.dispatch({ type: 'manual-parse-requested' });

      try {
        const result = parsedHints.headers
          ? await input.detectionService.parseRequest({
              userAgent: snapshot.userAgent,
              headers: parsedHints.headers,
            })
          : input.detectionService.parseUserAgent(snapshot.userAgent);
        if (destroyed || requestGeneration !== generation) return;
        input.store.dispatch({ type: 'manual-parse-succeeded', result });
      } catch (error) {
        if (destroyed || requestGeneration !== generation) return;
        input.store.dispatch({
          type: 'manual-parse-failed',
          message: error instanceof Error ? error.message : 'User-Agent parsing failed.',
        });
      }
    },
    reset() {
      generation += 1;
      debounce.cancel();
      input.store.dispatch({ type: 'manual-reset' });
    },
    destroy() {
      destroyed = true;
      generation += 1;
      debounce.destroy();
    },
  };

  return effect;
}
