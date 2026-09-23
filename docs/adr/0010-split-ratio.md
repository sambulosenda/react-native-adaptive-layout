# 0010. Split ratio on the layout

Date: 2026-09-23
Status: Accepted

## Context

Split mode gave both panes whatever the system chose, usually equal halves. List/detail screens and
media layouts need an unequal split. iOS 27.1 adds `View.splitArrangementLayoutRatio(_:)`, a
per-pane modifier: the pane with the highest `layoutPriority` is sized first by its ratio, and the
other pane fills the remainder.

Observed on the iPhone Duo simulator (iOS 27.1), `axis="vertical"`, ratio on the primary only:

| Posture              | Ratio | Primary | Secondary |
| -------------------- | ----- | ------- | --------- |
| Fully open (180°)    | unset | 334     | 334       |
| Fully open (180°)    | 0.3   | 200     | 468       |
| Fully open (180°)    | 0.5   | 334     | 334       |
| Fully open (180°)    | 0.7   | 468     | 200       |
| Partially open (88°) | any   | 224     | 404       |

Half open, the split follows the fold and the ratio has no effect. The native log confirmed the
ratio reached SwiftUI in every case. `axis="any"` was not measured.

## Decision

Add `splitRatio?: number` to `FoldableLayout`: the primary pane's preferred share, in (0, 1)
exclusive. The iOS layout applies `splitArrangementLayoutRatio` to the primary pane only, in the
split branch; the secondary fills the rest. Unset or invalid maps to `nil` (codegen value `0`).
Invalid values warn in development and are ignored rather than clamped, so the mistake stays
visible.

The prop lives on the layout, not on a slot, because a ratio relates the two panes. This refines
ADR 0005: relationships between panes are layout props; constraints on one pane (e.g. a future
`splitArrangementLayoutSize`) are slot props. A layout prop also rules out conflicting ratios on
both panes, which SwiftUI would resolve by `layoutPriority`, a value apps cannot see.

Jetpack WindowManager's `SplitAttributes.SplitType.ratio(x)` is also the primary's share, so the
prop maps directly to Android.

## Consequences

- It is a preference. The system may override it; on iPhone Duo it does whenever half open.
- Ignored in overlay mode and in every fallback (ADR 0004).
- Depends on an iOS 27.1 beta API. The modifier is confined to one call site behind
  `RNF_HAS_ARRANGEMENT_API`.
- No per-slot ratio, layout priority or size constraints until there is demand.
