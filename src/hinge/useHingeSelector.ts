import { useRef, useSyncExternalStore } from 'react';
import type { HingeSelector, HingeState } from '../types';
import { useHingeStore } from './context';

interface Selection<T> {
  snapshot: HingeState;
  selector: HingeSelector<T>;
  value: T;
}

/**
 * Subscribes to a derived value of the nearest enclosing `FoldableLayout`'s
 * hinge and re-renders only when that value changes.
 *
 * Angle updates arrive continuously while the hinge moves; selecting just the
 * posture (`useHingeSelector((h) => h.posture)`) skips those re-renders.
 * Values are compared with `isEqual` (default `Object.is`), so a selector that
 * returns a new object should pass a structural comparison. The selector may
 * be an inline function.
 *
 * Must be called from a component rendered inside a `FoldableLayout` pane.
 */
export function useHingeSelector<T>(
  selector: HingeSelector<T>,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = useHingeStore('useHingeSelector');
  const last = useRef<Selection<T> | null>(null);

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
