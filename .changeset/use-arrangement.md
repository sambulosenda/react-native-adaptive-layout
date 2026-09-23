---
'react-native-adaptive-layout': minor
---

Add `useArrangement()` and `useArrangementSelector()` to read how the system actually arranged the panes: which are visible, their frames, and whether they are `single`, `sideBySide`, `stacked` or `layered`. The testing entry gains an `arrangement` prop on `HingeTestProvider` and a `createArrangement()` helper.
