---
'react-native-adaptive-layout': patch
---

Fix `measureInWindow` and `measure` (`pageX` / `pageY`) for views inside a pane: they reported positions relative to the layout instead of the window, ignoring the layout's own offset on screen.
