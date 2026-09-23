import type { Arrangement, ArrangementKind, PaneArrangement, Rect } from '../types';

const HIDDEN: PaneArrangement = Object.freeze({ visible: false, frame: null });

/** Before the first native report. */
export const UNRESOLVED_ARRANGEMENT: Arrangement = Object.freeze({
  kind: 'unknown',
  size: null,
  primary: HIDDEN,
  secondary: HIDDEN,
});

/** Platforms without a native layout render only the primary pane. */
export const FALLBACK_ARRANGEMENT: Arrangement = Object.freeze({
  kind: 'single',
  size: null,
  primary: Object.freeze({ visible: true, frame: null }),
  secondary: HIDDEN,
});

/** Raw payload as emitted by the native layout. */
export interface NativePaneGeometry {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NativeArrangementPayload {
  width: number;
  height: number;
  primary: NativePaneGeometry;
  secondary: NativePaneGeometry;
}

/** Overlap below this many points counts as touching, not overlapping. */
const TOLERANCE = 1;

function toPane(geometry: NativePaneGeometry): PaneArrangement {
  const { visible, x, y, width, height } = geometry;
  // A hidden pane keeps a stale frame natively; a zero-area pane shows nothing.
  if (!visible || !(width > 0) || !(height > 0)) return HIDDEN;
  return { visible: true, frame: { x, y, width, height } };
}

function overlap(a0: number, a1: number, b0: number, b1: number): number {
  return Math.min(a1, b1) - Math.max(a0, b0);
}

export function classify(primary: Rect | null, secondary: Rect | null): ArrangementKind {
  if (!primary && !secondary) return 'unknown';
  if (!primary || !secondary) return 'single';
  const x = overlap(
    primary.x,
    primary.x + primary.width,
    secondary.x,
    secondary.x + secondary.width,
  );
  const y = overlap(
    primary.y,
    primary.y + primary.height,
    secondary.y,
    secondary.y + secondary.height,
  );
  if (x > TOLERANCE && y > TOLERANCE) return 'layered';
  return x <= TOLERANCE ? 'sideBySide' : 'stacked';
}

/**
 * Converts a native payload into an `Arrangement`. The kind is derived from
 * measured geometry only; it never depends on `mode` or the hinge.
 */
export function toArrangement(payload: NativeArrangementPayload): Arrangement {
  const primary = toPane(payload.primary);
  const secondary = toPane(payload.secondary);
  return {
    kind: classify(primary.frame, secondary.frame),
    size: { width: payload.width, height: payload.height },
    primary,
    secondary,
  };
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function samePane(a: PaneArrangement, b: PaneArrangement): boolean {
  return a.visible === b.visible && sameRect(a.frame, b.frame);
}

export function isSameArrangement(a: Arrangement, b: Arrangement): boolean {
  return (
    a.kind === b.kind &&
    a.size?.width === b.size?.width &&
    a.size?.height === b.size?.height &&
    samePane(a.primary, b.primary) &&
    samePane(a.secondary, b.secondary)
  );
}
