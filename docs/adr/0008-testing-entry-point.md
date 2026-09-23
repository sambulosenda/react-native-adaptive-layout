# 0008. Testing entry point

Date: 2026-09-23
Status: Accepted

## Context

`useHinge` and `useHingeSelector` throw outside a `FoldableLayout` pane (ADR 0003). Rendering a real
layout in Jest or Vitest needs the native Fabric component, so consumers could not unit-test their
own components that read the hinge without writing their own mocks of internal context.

## Decision

Add a `react-native-adaptive-layout/testing` subpath export with:

- `HingeTestProvider({ hinge, children })`: provides a per-tree hinge store through the same
  internal context the hooks read. Re-rendering with a new `hinge` publishes it, so hooks, listeners
  and selectors behave as on device, including the store's change de-duplication.
- `createHingeState(input)`: builds a `HingeState` from a `{ posture, angleDegrees }` shorthand (or
  `null` for no hinge), applying the same rules as native events: a non-finite angle is
  unavailable, an unrecognised posture is `'unknown'`.
- Types `HingeInput` and `HingeTestProviderProps`.

It is a separate entry so test-only code stays out of app bundles, and it imports nothing from
`react-native`, so it runs in plain Node test environments.

## Consequences

- Consumers can test hinge-aware components without the native layout.
- The testing entry shares the internal hinge context module with the main entry, so both must come
  from the same installed copy of the package.
- Rendering `FoldableLayout` itself in tests remains unsupported.
- The package ships ESM only; Jest users add it to `transformIgnorePatterns` (documented).
