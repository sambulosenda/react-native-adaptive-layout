import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';

/** How the two panes are arranged when the system decides to show both. */
export type LayoutMode = 'split' | 'overlay';

/** Which axes the system may use to arrange the panes. */
export type LayoutAxis = 'any' | 'horizontal' | 'vertical';

/** Physical state of the device hinge as reported by the OS. */
export type FoldPosture = 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';

/**
 * A snapshot of the hinge. When no hinge is present (`available === false`) the
 * angles are `null` and the posture is `'unknown'`; nothing is ever inferred.
 * Checking `available` narrows the angles to `number`.
 */
export type HingeState =
  | {
      readonly available: false;
      readonly angleRadians: null;
      readonly angleDegrees: null;
      readonly posture: 'unknown';
    }
  | {
      readonly available: true;
      /** Hinge angle in radians, as reported by the OS. */
      readonly angleRadians: number;
      /** Hinge angle in degrees, derived from `angleRadians` for convenience. */
      readonly angleDegrees: number;
      readonly posture: FoldPosture;
    };

export type HingeListener = (hinge: HingeState) => void;

export type HingeSelector<T> = (hinge: HingeState) => T;

export interface FoldableLayoutProps extends ViewProps {
  /**
   * Exactly one `FoldableLayout.Primary` and one `FoldableLayout.Secondary`,
   * in any order. Other children are ignored with a development warning.
   */
  children?: ReactNode;
  /** @default 'split' */
  mode?: LayoutMode;
  /** @default 'any' */
  axis?: LayoutAxis;
  /**
   * Whether hinge updates are delivered to `useHinge` inside this layout.
   * Adaptive layout is unaffected by this flag.
   * @default true
   */
  trackHinge?: boolean;
}

/** A horizontal edge, resolved against the layout direction. */
export type OverlayEdge = 'leading' | 'trailing';

export interface SlotProps {
  children?: ReactNode;
  /**
   * In overlay mode, the edge this pane is anchored to when the system
   * transitions the overlay into a side-by-side layout (on iPhone Duo, the
   * half-open posture). Setting it on one slot gives the other slot the
   * opposite edge; when neither is set, the system chooses. Ignored in split
   * mode and in fallbacks.
   */
  overlayEdge?: OverlayEdge;
}
