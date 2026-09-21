import type { ReactElement, ReactNode } from 'react';
import { Children, Fragment, isValidElement } from 'react';
import type { SlotProps } from '../types';

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
  primary: ReactElement | null;
  secondary: ReactElement | null;
  /** Human-readable issues with the supplied children, for development warnings. */
  issues: string[];
}

/**
 * Extracts the `Primary` and `Secondary` slot elements from a layout's children.
 * Matching is by component identity so authoring order is irrelevant.
 */
export function resolveSlots(children: ReactNode): ResolvedSlots {
  const issues: string[] = [];
  let primary: ReactElement | null = null;
  let secondary: ReactElement | null = null;

  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === Primary) {
      if (primary) issues.push(duplicate('Primary'));
      else primary = child;
    } else if (isValidElement(child) && child.type === Secondary) {
      if (secondary) issues.push(duplicate('Secondary'));
      else secondary = child;
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
