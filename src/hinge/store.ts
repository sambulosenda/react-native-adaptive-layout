import type { HingeState } from '../types';
import { isSameHinge, UNAVAILABLE_HINGE } from './state';

export interface HingeStore {
  getSnapshot(): HingeState;
  subscribe(listener: () => void): () => void;
  publish(next: HingeState): void;
}

/**
 * A minimal external store, one per `FoldableLayout`, so hinge events stay
 * scoped to the scene that produced them and `useSyncExternalStore` can
 * subscribe without tearing.
 */
export function createHingeStore(initial: HingeState = UNAVAILABLE_HINGE): HingeStore {
  let current = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    publish(next) {
      if (isSameHinge(current, next)) return;
      current = next;
      for (const listener of listeners) listener();
    },
  };
}
