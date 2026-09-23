import { useStoreSelector } from '../store';
import type { Arrangement, ArrangementSelector } from '../types';
import { useArrangementStore } from './context';

const identity = (arrangement: Arrangement) => arrangement;

/**
 * Returns how the nearest enclosing `FoldableLayout` currently arranges its
 * panes (which are visible, where, and whether they sit side by side, stacked
 * or layered) and re-renders when that changes.
 *
 * Must be called from a component rendered inside a `FoldableLayout` pane.
 */
export function useArrangement(): Arrangement {
  return useStoreSelector(useArrangementStore('useArrangement'), identity, Object.is);
}

/**
 * Like `useArrangement`, but returns a derived value and re-renders only when
 * it changes, e.g. `useArrangementSelector((a) => a.secondary.visible)`.
 */
export function useArrangementSelector<T>(
  selector: ArrangementSelector<T>,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  return useStoreSelector(useArrangementStore('useArrangementSelector'), selector, isEqual);
}
