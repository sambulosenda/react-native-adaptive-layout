# 0004. Graceful fallbacks instead of throwing

Date: 2026-09-21
Status: Accepted

## Context

Unsupported platforms and OS versions could throw at render time or render a fallback.

## Decision

Render a deterministic fallback: primary fills the layout, the secondary subtree stays mounted but
hidden, and the hinge reports unavailable. Overlay on older iOS stacks primary above secondary.

## Consequences

- Apps can adopt the component without platform branching.
- Behaviour on unsupported platforms is documented and tested (slot resolution, hinge store).
- A contributor adding Android replaces the fallback file rather than touching call sites.
