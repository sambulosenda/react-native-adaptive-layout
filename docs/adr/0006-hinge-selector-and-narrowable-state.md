# 0006. Hinge selector and narrowable hinge state

Date: 2026-09-22
Status: Accepted

## Context

`useHinge` re-renders on every hinge change. While the hinge moves the OS reports the angle many
times a second (174°, 175°, 180° within one second on the iPhone Duo simulator), so a component that
only reads the posture re-renders for every angle tick.

`HingeState` declared `available: boolean` and `angleDegrees: number | null` independently, so
TypeScript could not narrow the angle after checking `available`. `toHingeState` could also produce
`available: true` with a `null` angle when the native angle was non-finite.

`useHinge(fn)` already takes a listener. A selector has the same shape, so the two cannot be told
apart at runtime and `useHinge` cannot be overloaded with a selector.

## Decision

- Add `useHingeSelector(selector, isEqual = Object.is)` and export the `HingeSelector<T>` type. It
  subscribes to the same per-layout store (ADR 0003) through `useSyncExternalStore` and returns the
  previous value while it is still equal, so equal selections do not re-render. Memoisation is
  implemented locally rather than adding `use-sync-external-store` as a dependency.
- Make `HingeState` a discriminated union on `available`: `false` carries `null` angles and
  `'unknown'` posture; `true` carries numeric angles and the OS posture.
- `toHingeState` reports a non-finite native angle as unavailable (`UNAVAILABLE_HINGE`). The native
  layer always sends a finite `hinge.angle.radians`, so this is a defensive branch.

## Consequences

- `if (hinge.available) hinge.angleDegrees.toFixed()` type-checks without `!`; enforced by a type
  test in `tests/hinge.test.ts` that runs under `yarn typecheck`.
- Posture-only consumers can avoid re-rendering during hinge motion.
- In the non-finite-angle case the OS posture is dropped. Accepted because a hinge whose angle
  cannot be read is not usable, and the case is not expected to occur.
- Code that constructed `HingeState` objects with `available: boolean` must now pick a variant. This
  is a type-level change for consumers only; runtime values are unchanged for real hinges.
