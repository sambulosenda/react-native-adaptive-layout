# 0002. Native-owned pane geometry

Date: 2026-09-21
Status: Accepted

## Context

SwiftUI decides where panes go. Yoga also wants to lay out those panes. Two layout engines cannot
both own the same frame.

## Decision

SwiftUI owns pane position and size. Each pane is a `RootNodeKind` shadow node whose size is set
from native state (`RNFoldablePaneState`) and whose content origin is the SwiftUI-assigned origin.
Fabric layout metrics for the pane are overridden with the native frame so stale commits never
resize it.

## Consequences

- `onLayout`, `measure*` and touch targets inside panes are correct.
- Every posture change round-trips through the shadow tree (one state update per pane).
- A future Android implementation must feed geometry the same way.
