---
'react-native-adaptive-layout': minor
---

Add a `react-native-adaptive-layout/testing` entry with `HingeTestProvider` and `createHingeState`, so components that use `useHinge` or `useHingeSelector` can be unit-tested without rendering a native `FoldableLayout`.
