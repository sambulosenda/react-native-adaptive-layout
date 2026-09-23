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

/** A rectangle in the coordinate space of the enclosing `FoldableLayout`. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * How the system arranged the panes, derived from their measured geometry:
 * - `single`: one pane is shown, the other is hidden.
 * - `sideBySide`: both shown, next to each other.
 * - `stacked`: both shown, one above the other.
 * - `layered`: both shown, overlapping (overlay mode).
 * - `unknown`: not measured yet.
 */
export type ArrangementKind = 'unknown' | 'single' | 'sideBySide' | 'stacked' | 'layered';

export interface PaneArrangement {
  readonly visible: boolean;
  /** Frame in layout coordinates, or `null` when hidden or not measured yet. */
  readonly frame: Rect | null;
}

export interface Arrangement {
  readonly kind: ArrangementKind;
  /** Size of the layout, or `null` when not measured yet. */
  readonly size: { readonly width: number; readonly height: number } | null;
  readonly primary: PaneArrangement;
  readonly secondary: PaneArrangement;
}

export type ArrangementSelector<T> = (arrangement: Arrangement) => T;

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
  /**
   * Preferred share of the layout, between 0 and 1 exclusive, given to the
   * primary pane in split mode. The secondary pane fills the rest. It is a
   * preference: the system may adjust it. Ignored in overlay mode and in
   * fallbacks. Unset lets the system choose.
   */
  splitRatio?: number;
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
