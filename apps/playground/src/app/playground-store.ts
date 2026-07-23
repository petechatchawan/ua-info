import type { PlaygroundAction } from './playground-actions';
import { reducePlaygroundState } from './playground-reducer';
import {
  createInitialPlaygroundState,
  type PlaygroundState,
} from './playground-state';

export interface PlaygroundStore {
  getState(): PlaygroundState;
  dispatch(action: PlaygroundAction): void;
  subscribe(listener: (state: PlaygroundState) => void): () => void;
}

export function createPlaygroundStore(
  initialState: PlaygroundState = createInitialPlaygroundState(),
): PlaygroundStore {
  let state = initialState;
  const listeners = new Set<(state: PlaygroundState) => void>();

  return {
    getState: () => state,
    dispatch(action) {
      const nextState = reducePlaygroundState(state, action);
      if (nextState === state) return;
      state = nextState;
      for (const listener of listeners) listener(state);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
