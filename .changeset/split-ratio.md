---
'react-native-adaptive-layout': minor
---

Add a `splitRatio` prop to `FoldableLayout`: the primary pane's preferred share of the layout in split mode, between 0 and 1. The system may override it; on iPhone Duo the split follows the fold when half open. Ignored in overlay mode and in fallbacks. Uses an iOS 27.1 beta API.
