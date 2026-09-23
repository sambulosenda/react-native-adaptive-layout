import { type ReactNode, useEffect, useState } from 'react';
import { HingeStoreContext } from '../hinge/context';
import { UNAVAILABLE_HINGE } from '../hinge/state';
import { createHingeStore } from '../hinge/store';
import type { FoldPosture, HingeState } from '../types';

/**
 * A hinge for tests: a full `HingeState`, a `{ posture, angleDegrees }`
 * shorthand for an available hinge, or nothing for "no hinge".
 */
export type HingeInput =
  | HingeState
  | { readonly posture: FoldPosture; readonly angleDegrees: number }
  | null
  | undefined;

const POSTURES: ReadonlySet<string> = new Set<FoldPosture>([
  'unknown',
  'closed',
  'partiallyOpen',
  'fullyOpen',
]);

/**
 * Builds a valid `HingeState`. The shorthand follows the same rules as real
 * hinge events: a non-finite angle is reported as unavailable and an
 * unrecognised posture as `'unknown'`.
 */
export function createHingeState(input?: HingeInput): HingeState {
  if (!input) return UNAVAILABLE_HINGE;
  if ('available' in input) return input;
  const { angleDegrees, posture } = input;
  if (!Number.isFinite(angleDegrees)) return UNAVAILABLE_HINGE;
  return {
    available: true,
    angleDegrees,
    angleRadians: (angleDegrees * Math.PI) / 180,
    posture: POSTURES.has(posture) ? posture : 'unknown',
  };
}

export interface HingeTestProviderProps {
  /** The hinge reported to `useHinge` / `useHingeSelector`. Defaults to no hinge. */
  hinge?: HingeInput;
  children?: ReactNode;
}

/**
 * Provides a hinge to components that call `useHinge` or `useHingeSelector`,
 * without rendering a native `FoldableLayout`. Re-render with a new `hinge`
 * to simulate folding; subscribers update exactly as they do on device.
 */
export function HingeTestProvider({ hinge, children }: HingeTestProviderProps) {
  const [store] = useState(() => createHingeStore(createHingeState(hinge)));

  // The store ignores publishes that do not change the hinge, so this is a
  // no-op on re-renders with an equivalent value.
  useEffect(() => {
    store.publish(createHingeState(hinge));
  });

  return <HingeStoreContext value={store}>{children}</HingeStoreContext>;
}
