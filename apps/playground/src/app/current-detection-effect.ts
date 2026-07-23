import type { UADetectionService } from '../services/ua-detection-service';
import type { PlaygroundStore } from './playground-store';

export interface CurrentDetectionEffect {
  detect(): Promise<void>;
  destroy(): void;
}

export function createCurrentDetectionEffect(input: {
  readonly store: PlaygroundStore;
  readonly detectionService: UADetectionService;
}): CurrentDetectionEffect {
  let generation = 0;
  let destroyed = false;

  return {
    async detect() {
      const requestGeneration = ++generation;
      input.store.dispatch({ type: 'current-detection-requested' });
      try {
        const result = await input.detectionService.detectCurrent();
        if (destroyed || requestGeneration !== generation) return;
        input.store.dispatch({ type: 'current-detection-succeeded', result });
      } catch (error) {
        if (destroyed || requestGeneration !== generation) return;
        input.store.dispatch({
          type: 'current-detection-failed',
          message:
            error instanceof Error
              ? error.message
              : 'Current browser detection failed.',
        });
      }
    },
    destroy() {
      destroyed = true;
      generation += 1;
    },
  };
}
