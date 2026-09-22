import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { HingeListener, HingeState } from '../types';
import { useHingeStore } from './context';

/**
 * Subscribes to the hinge of the nearest enclosing `FoldableLayout`.
 *
 * Returns the current `HingeState` and re-renders on change. The optional
 * listener is invoked with the initial state and then on every change; it is
 * always the latest closure, so it needs no memoisation.
 *
 * Must be called from a component rendered inside a `FoldableLayout` pane.
 */
export function useHinge(listener?: HingeListener): HingeState {
  const store = useHingeStore('useHinge');

  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  }, [listener]);

  const hinge = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    latest.current?.(hinge);
  }, [hinge]);

  return hinge;
}
