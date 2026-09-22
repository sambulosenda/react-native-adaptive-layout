# 0005. Per-slot overlay edge

Date: 2026-09-22
Status: Accepted

## Context

SwiftUI's overlay arrangement can transition into a side-by-side layout when the environment
changes, e.g. when a foldable is unfolded. `View.overlayArrangementEdge(_:)` (iOS 27.1) anchors a
pane to the leading or trailing edge when that happens; `nil` leaves the choice to the system.
The modifier applies to an individual pane, not to the arrangement.

## Decision

Add an optional `overlayEdge?: 'leading' | 'trailing'` prop to both `FoldableLayout.Primary` and
`FoldableLayout.Secondary`, and export the `OverlayEdge` type. Leading/trailing (not left/right)
keeps RTL correct and mirrors `HorizontalEdge`. Unset maps to `nil`.

The slots still render no view (ADR 0001). The iOS layout reads the prop from the resolved slot
elements and passes it to the native layout as `primaryOverlayEdge` / `secondaryOverlayEdge`
(`'none' | 'leading' | 'trailing'`), so the pane component and its shadow node are unchanged.
The modifier is applied only in the overlay branch of the adaptive tree.

## Consequences

- One more prop per slot; no behaviour change when unset.
- Ignored in split mode and in every fallback (ADR 0004); no platform branching in app code.
- Future per-pane modifiers (`splitArrangementLayoutRatio`, `splitArrangementLayoutSize`, …) can
  follow the same slot-prop → layout-prop route.

## Addendum (2026-09-22): edges are resolved as a pair

Observed on the iPhone Duo simulator (iOS 27.1, hinge ~87°, `partiallyOpen`):

| Primary edge | Secondary edge | Result                                        |
| ------------ | -------------- | --------------------------------------------- |
| unset        | unset          | Primary trailing, secondary leading           |
| leading      | unset          | Primary leading, secondary trailing           |
| trailing     | unset          | Both trailing: panes overlap, leading is empty |
| leading      | trailing       | As requested                                  |
| trailing     | leading        | As requested                                  |

SwiftUI does not reconcile per-pane edges; an unset pane falls back to trailing once the other pane
sets an edge. At 180° (`fullyOpen`) the overlay stayed layered, so the edge had no effect.

Decision: when exactly one slot sets `overlayEdge`, the library passes the opposite edge for the
other slot. Explicit edges on both slots pass through unchanged; the same edge on both emits a
development warning. Neither set still maps to `nil` so the system chooses. Resolution is a pure
function (`resolveOverlayEdges`) with unit tests; no native change.

