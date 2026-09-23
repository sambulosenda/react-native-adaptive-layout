import { useStoreSelector } from '../store';
import type { HingeSelector } from '../types';
import { useHingeStore } from './context';

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
  return useStoreSelector(useHingeStore('useHingeSelector'), selector, isEqual);
}
