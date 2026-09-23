import type { ReactElement, ReactNode } from 'react';
import { Children, Fragment, isValidElement } from 'react';
import type { OverlayEdge, SlotProps } from '../types';

/** Marks the content of the primary pane. Renders no view of its own. */
export function Primary({ children }: SlotProps): ReactNode {
  return children;
}
Primary.displayName = 'FoldableLayout.Primary';

/** Marks the content of the secondary pane. Renders no view of its own. */
export function Secondary({ children }: SlotProps): ReactNode {
  return children;
}
Secondary.displayName = 'FoldableLayout.Secondary';

export interface ResolvedSlots {
  primary: ReactElement<SlotProps> | null;
  secondary: ReactElement<SlotProps> | null;
  /** Human-readable issues with the supplied children, for development warnings. */
  issues: string[];
}

/**
 * Extracts the `Primary` and `Secondary` slot elements from a layout's children.
 * Matching is by component identity so authoring order is irrelevant.
 */
export function resolveSlots(children: ReactNode): ResolvedSlots {
  const issues: string[] = [];
  let primary: ReactElement<SlotProps> | null = null;
  let secondary: ReactElement<SlotProps> | null = null;

  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === Primary) {
      if (primary) issues.push(duplicate('Primary'));
      else primary = child as ReactElement<SlotProps>;
    } else if (isValidElement(child) && child.type === Secondary) {
      if (secondary) issues.push(duplicate('Secondary'));
      else secondary = child as ReactElement<SlotProps>;
    } else {
      issues.push(
        `Ignoring unexpected child ${describe(child)}. Only FoldableLayout.Primary and FoldableLayout.Secondary are rendered.`,
      );
    }
  }

  if (!primary) issues.push(missing('Primary'));
  if (!secondary) issues.push(missing('Secondary'));

  return { primary, secondary, issues };
}

export interface ResolvedOverlayEdges {
  primary: OverlayEdge | 'none';
  secondary: OverlayEdge | 'none';
  issues: string[];
}

const OPPOSITE: Record<OverlayEdge, OverlayEdge> = { leading: 'trailing', trailing: 'leading' };

/**
 * Resolves the edges passed to the native overlay arrangement.
 *
 * SwiftUI does not reconcile per-pane edges: when only one pane sets an edge
 * the other still defaults to trailing, so `trailing` on one pane stacks both
 * panes on the same side. Setting one slot therefore gives the other slot the
 * opposite edge. With neither set, the system chooses (see ADR 0005).
 */
export function resolveOverlayEdges(
  primary: OverlayEdge | undefined,
  secondary: OverlayEdge | undefined,
): ResolvedOverlayEdges {
  const issues: string[] = [];
  if (primary && secondary && primary === secondary) {
    issues.push(
      `Both panes set overlayEdge="${primary}", so they will overlap on that side. Set opposite edges or set only one.`,
    );
  }
  return {
    primary: primary ?? (secondary ? OPPOSITE[secondary] : 'none'),
    secondary: secondary ?? (primary ? OPPOSITE[primary] : 'none'),
    issues,
  };
}

/** `0` tells native the ratio is unset. */
export function resolveSplitRatio(ratio: number | undefined): {
  value: number;
  issues: string[];
} {
  if (ratio === undefined) return { value: 0, issues: [] };
  if (Number.isFinite(ratio) && ratio > 0 && ratio < 1) return { value: ratio, issues: [] };
  return {
    value: 0,
    issues: [`splitRatio must be between 0 and 1 exclusive; got ${ratio}. It is ignored.`],
  };
}

function duplicate(slot: string): string {
  return `More than one FoldableLayout.${slot} was provided; only the first is rendered.`;
}

function missing(slot: string): string {
  return `FoldableLayout.${slot} is missing; that pane will be empty.`;
}

function describe(child: ReactNode): string {
  if (!isValidElement(child)) return `${typeof child} "${String(child)}"`;
  const type: unknown = child.type;
  if (type === Fragment) return '<Fragment>';
  if (typeof type === 'string') return `<${type}>`;
  if (typeof type === 'function' || (typeof type === 'object' && type !== null)) {
    const named = type as { displayName?: string; name?: string };
    return `<${named.displayName ?? named.name ?? 'Anonymous'}>`;
  }
  return 'an unknown element';
}
