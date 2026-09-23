import { useRef, useSyncExternalStore } from 'react';

export interface Store<T> {
  getSnapshot(): T;
  subscribe(listener: () => void): () => void;
  publish(next: T): void;
}

/**
 * A minimal external store, one per `FoldableLayout`, so native events stay
 * scoped to the scene that produced them and `useSyncExternalStore` can
 * subscribe without tearing. Publishing an equal value is a no-op.
 */
export function createStore<T>(initial: T, isSame: (a: T, b: T) => boolean): Store<T> {
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
      if (isSame(current, next)) return;
      current = next;
      for (const listener of listeners) listener();
    },
  };
}

interface Selection<S, T> {
  snapshot: S;
  selector: (snapshot: S) => T;
  value: T;
}

/**
 * Subscribes to a derived value of a store and re-renders only when it
 * changes according to `isEqual`. The selector may be an inline function.
 */
export function useStoreSelector<S, T>(
  store: Store<S>,
  selector: (snapshot: S) => T,
  isEqual: (a: T, b: T) => boolean,
): T {
  const last = useRef<Selection<S, T> | null>(null);

  // Returns the previous value whenever it is still equal, so
  // useSyncExternalStore sees a stable result and skips the re-render.
  const getSelection = (): T => {
    const snapshot = store.getSnapshot();
    const previous = last.current;
    if (previous && previous.snapshot === snapshot && previous.selector === selector) {
      return previous.value;
    }
    const next = selector(snapshot);
    const value = previous && isEqual(previous.value, next) ? previous.value : next;
    last.current = { snapshot, selector, value };
    return value;
  };

  return useSyncExternalStore(store.subscribe, getSelection, getSelection);
}
