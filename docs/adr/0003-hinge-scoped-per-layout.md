# 0003. Hinge state scoped per layout

Date: 2026-09-21
Status: Accepted

## Context

Hinge updates could be a process-wide subscription (a native module emitting global events) or
scoped to the SwiftUI scene that observes them.

## Decision

Each `FoldableLayout` observes its own scene via `.onHingeChange` and owns a `HingeStore` provided
through Context. `useHinge` reads the nearest store and throws outside a layout.

## Consequences

- Multi-window apps get correct per-scene state.
- No global singletons; tests can construct stores directly.
- Reading hinge state outside a layout is not supported; a future `useDeviceHinge` could add a
  process-wide variant if demand appears.
