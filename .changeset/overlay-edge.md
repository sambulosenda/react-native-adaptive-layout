---
'react-native-adaptive-layout': minor
---

Add `overlayEdge` to `FoldableLayout.Primary` and `FoldableLayout.Secondary`. In overlay mode it anchors the pane to the leading or trailing edge when the system turns the overlay into a side-by-side layout (iOS 27.1+; on iPhone Duo, the half-open posture). Setting it on one slot gives the other the opposite edge. Ignored in split mode and fallbacks.
