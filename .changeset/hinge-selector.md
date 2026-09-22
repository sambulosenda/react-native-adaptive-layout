---
'react-native-foldable': minor
---

Add `useHingeSelector(selector, isEqual?)` to subscribe to a derived hinge value (for example just the posture) and skip re-renders while the angle changes. `HingeState` is now a discriminated union, so checking `hinge.available` narrows `angleDegrees` / `angleRadians` to `number`. A hinge whose angle cannot be read is now reported as unavailable instead of `available: true` with a `null` angle.
