import { type ReactNode, useEffect, useState } from 'react';
import { ArrangementStoreContext } from '../arrangement/context';
import { UNRESOLVED_ARRANGEMENT } from '../arrangement/state';
import { createArrangementStore } from '../arrangement/store';
import { HingeStoreContext } from '../hinge/context';
import { UNAVAILABLE_HINGE } from '../hinge/state';
import { createHingeStore } from '../hinge/store';
import type { Arrangement, ArrangementKind, FoldPosture, HingeState } from '../types';

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

/**
 * Builds a plausible `Arrangement` of the given kind for a layout of `size`:
 * halves for `sideBySide` / `stacked`, full-size panes for `layered`, and the
 * primary pane alone for `single`.
 */
export function createArrangement(
  kind: ArrangementKind,
  size: { width: number; height: number } = { width: 800, height: 500 },
): Arrangement {
  const { width, height } = size;
  const full = { x: 0, y: 0, width, height };
  const shown = (frame: typeof full) => ({ visible: true, frame });
  const hidden = { visible: false, frame: null };
  switch (kind) {
    case 'unknown':
      return UNRESOLVED_ARRANGEMENT;
    case 'single':
      return { kind, size, primary: shown(full), secondary: hidden };
    case 'layered':
      return { kind, size, primary: shown(full), secondary: shown(full) };
    case 'sideBySide':
      return {
        kind,
        size,
        primary: shown({ x: 0, y: 0, width: width / 2, height }),
        secondary: shown({ x: width / 2, y: 0, width: width / 2, height }),
      };
    case 'stacked':
      return {
        kind,
        size,
        primary: shown({ x: 0, y: 0, width, height: height / 2 }),
        secondary: shown({ x: 0, y: height / 2, width, height: height / 2 }),
      };
  }
}

export interface HingeTestProviderProps {
  /** The hinge reported to `useHinge` / `useHingeSelector`. Defaults to no hinge. */
  hinge?: HingeInput;
  /**
   * The arrangement reported to `useArrangement` / `useArrangementSelector`.
   * Defaults to `unknown` (not measured yet). See `createArrangement`.
   */
  arrangement?: Arrangement;
  children?: ReactNode;
}

/**
 * Provides a hinge and an arrangement to components that call `useHinge`,
 * `useHingeSelector`, `useArrangement` or `useArrangementSelector`, without
 * rendering a native `FoldableLayout`. Re-render with a new `hinge`
 * to simulate folding; subscribers update exactly as they do on device.
 */
export function HingeTestProvider({ hinge, arrangement, children }: HingeTestProviderProps) {
  const [store] = useState(() => createHingeStore(createHingeState(hinge)));
  const [arrangementStore] = useState(() =>
    createArrangementStore(arrangement ?? UNRESOLVED_ARRANGEMENT),
  );

  // The stores ignore publishes that do not change their value, so these are
  // no-ops on re-renders with an equivalent value.
  useEffect(() => {
    store.publish(createHingeState(hinge));
    arrangementStore.publish(arrangement ?? UNRESOLVED_ARRANGEMENT);
  });

  return (
    <HingeStoreContext value={store}>
      <ArrangementStoreContext value={arrangementStore}>{children}</ArrangementStoreContext>
    </HingeStoreContext>
  );
}
