# 0009. Report the resolved arrangement

Date: 2026-09-23
Status: Accepted

## Context

Apps declare intent (`mode`, `axis`) but could not observe what the system chose: whether both panes
are shown, and whether they sit side by side, stacked or layered. A list/detail screen needs this to
show a back button only when the detail pane is alone. The only signal was each pane's `onLayout`
size.

Investigation on the iPhone Duo simulator (iOS 27.1):

- Yoga reports every pane at `0,0`; positions exist only natively.
- SwiftUI hides a pane by **detaching its container from the window**. It does not set `isHidden` or
  alpha, keeps the superview, and leaves the last frame in place. A JS measurement therefore cannot
  tell a hidden pane from a visible one.
- Observed layouts: split side by side (touching when flat, with a ~40pt hinge gap half open),
  stacked when closed with `axis="any"`, one pane detached when the axis cannot fit, overlay layered
  when flat and side by side when half open with a horizontal axis.

## Decision

- Native: each `PaneContainer` reports `visible = window != nil` from `didMoveToWindow` and its frame
  in layout coordinates from `layoutSubviews`. The host keeps the last geometry per pane, coalesces
  updates to one per run-loop turn, drops unchanged ones, and emits a new direct event
  `onArrangementUpdate { width, height, primary, secondary }`.
- JS: a pure `toArrangement` maps the payload to
  `{ kind, size, primary: { visible, frame }, secondary: { visible, frame } }`. Hidden or zero-area
  panes get `frame: null` (never the stale frame). `kind` is derived from geometry only:
  `single` (one visible), `layered` (overlap > 1pt on both axes), otherwise `sideBySide` or
  `stacked`; `unknown` before the first report.
- Hooks `useArrangement()` and `useArrangementSelector(selector, isEqual?)` read a per-layout store
  (same pattern as the hinge, ADR 0003/0006). The store and selector logic are now shared by both.
- The fallback layout reports `single` with only the primary visible.
- `HingeTestProvider` accepts an `arrangement`, and `createArrangement(kind, size?)` builds plausible
  frames for tests.

Exports: `useArrangement`, `useArrangementSelector`, and types `Arrangement`, `ArrangementKind`,
`ArrangementSelector`, `PaneArrangement`, `Rect`; `createArrangement` from `/testing`.

## Consequences

- Apps can adapt UI to the actual arrangement, including placing content around the hinge gap.
- `kind` does not distinguish an overlay that turned side by side from a split; apps know their own
  `mode`.
- Frames describe the layout's coordinate space, not the window.
- Transitions emit intermediate arrangements while SwiftUI animates; the selector hook limits
  re-renders to values an app actually reads.
- `HingeTestProvider` now provides more than the hinge; the name is kept for compatibility.
