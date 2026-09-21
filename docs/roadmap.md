# Roadmap

## 0.1 — iOS foundation (current)

- Fabric `FoldableLayout` with split/overlay modes and axis restriction
- `useHinge` with OS-reported posture and angle
- Deterministic fallbacks, example app, CI, docs

## 0.2 — Android

Design intent, to be confirmed in an ADR before implementation:

- `WindowInfoTracker` from Jetpack WindowManager supplies `FoldingFeature`
  (state `FLAT`/`HALF_OPENED`, orientation, bounds).
- `RNFoldableLayout` becomes a `ViewGroup` that positions the two pane children on either side of
  the folding feature when `mode === 'split'` and the axis permits; otherwise primary fills.
- Posture mapping: `HALF_OPENED` → `partiallyOpen`, `FLAT` → `fullyOpen`; Android exposes no angle
  through WindowManager, so `angle` reports `NaN` and JS normalises it to `null`.
- Pane geometry feeds shadow state exactly as on iOS.

## Later

- `usePosture()` convenience hook returning only posture
- Custom split ratios and drag-to-resize where the OS allows
- Web: CSS Viewport Segments (`env(viewport-segment-*)`) once broadly available
