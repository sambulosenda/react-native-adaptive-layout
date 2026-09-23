# react-native-adaptive-layout

## 0.3.0

### Minor Changes

- [#14](https://github.com/sambulosenda/react-native-foldable/pull/14) [`7a6a2f7`](https://github.com/sambulosenda/react-native-foldable/commit/7a6a2f7f1292309ca307fee25f1630470a4477cb) Thanks [@sambulosenda](https://github.com/sambulosenda)! - Add a `react-native-adaptive-layout/testing` entry with `HingeTestProvider` and `createHingeState`, so components that use `useHinge` or `useHingeSelector` can be unit-tested without rendering a native `FoldableLayout`.

## 0.2.0

### Minor Changes

- [#9](https://github.com/sambulosenda/react-native-foldable/pull/9) [`138e1c0`](https://github.com/sambulosenda/react-native-foldable/commit/138e1c02733ed7c54e0227d9e1034717aeb05f67) Thanks [@sambulosenda](https://github.com/sambulosenda)! - Add `useHingeSelector(selector, isEqual?)` to subscribe to a derived hinge value (for example just the posture) and skip re-renders while the angle changes. `HingeState` is now a discriminated union, so checking `hinge.available` narrows `angleDegrees` / `angleRadians` to `number`. A hinge whose angle cannot be read is now reported as unavailable instead of `available: true` with a `null` angle.

- [#8](https://github.com/sambulosenda/react-native-foldable/pull/8) [`1313219`](https://github.com/sambulosenda/react-native-foldable/commit/1313219e3bc9d0adc7fa0b4621066581e0579e6b) Thanks [@sambulosenda](https://github.com/sambulosenda)! - Add `overlayEdge` to `FoldableLayout.Primary` and `FoldableLayout.Secondary`. In overlay mode it anchors the pane to the leading or trailing edge when the system turns the overlay into a side-by-side layout (iOS 27.1+; on iPhone Duo, the half-open posture). Setting it on one slot gives the other the opposite edge. Ignored in split mode and fallbacks.

- [#12](https://github.com/sambulosenda/react-native-foldable/pull/12) [`1d4cc6f`](https://github.com/sambulosenda/react-native-foldable/commit/1d4cc6f3b5ac72f97f02a2ebd729fc9d5c8fce05) Thanks [@sambulosenda](https://github.com/sambulosenda)! - First release published as `react-native-adaptive-layout` (the name `react-native-foldable` belongs to an unrelated npm package). Install with `yarn add react-native-adaptive-layout`; exported API names are unchanged.

Managed by [Changesets](https://github.com/changesets/changesets). Entries are generated on release.
