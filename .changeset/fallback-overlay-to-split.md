---
'react-native-adaptive-layout': patch
---

iOS: on the pre-27.1 fallback, switching `mode` from `overlay` to `split` now reports the secondary pane as hidden. `useArrangement` previously kept reporting it visible (kind `overlay` instead of `single`).
