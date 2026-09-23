# Roadmap

## Shipped (iOS)

- **0.1:** Fabric `FoldableLayout` with split/overlay modes and axis restriction; `useHinge` with
  OS-reported posture and angle; deterministic fallbacks, example app, CI, docs.
- **0.2:** `overlayEdge` per slot (ADR 0005); `useHingeSelector` (ADR 0006); published as
  `react-native-adaptive-layout` (ADR 0007).
- **0.3:** `react-native-adaptive-layout/testing` with `HingeTestProvider` (ADR 0008).
- **0.4:** `useArrangement` / `useArrangementSelector` (ADR 0009); `splitRatio` (ADR 0010).

## Next — Android

Design intent, to be confirmed in an ADR before implementation:

- `WindowInfoTracker` from Jetpack WindowManager supplies `FoldingFeature`
  (state `FLAT`/`HALF_OPENED`, orientation, bounds).
- `RNFoldableLayout` becomes a `ViewGroup` that positions the two pane children on either side of
  the folding feature when `mode === 'split'` and the axis permits; otherwise primary fills.
- Posture mapping: `HALF_OPENED` → `partiallyOpen`, `FLAT` → `fullyOpen`; Android exposes no angle
  through WindowManager, so `angle` reports `NaN` and JS normalises it to `null`.
- Pane geometry feeds shadow state exactly as on iOS.
- `onArrangementUpdate` reports pane visibility and frames so `useArrangement` works (without it,
  `kind` stays `unknown`).
- `splitRatio` sizes the primary pane when flat; across a folding feature the split follows the
  fold, as on iOS (ADR 0010).
- `overlayEdge` anchors panes when an overlay turns side by side.

## Later

- Split size constraints per pane (`minWidth` / `maxWidth` style slot props, backed by
  `splitArrangementLayoutSize` on iOS) once there is demand.
- Drag-to-resize where the OS allows it.
- Web: CSS Viewport Segments (`env(viewport-segment-*)`) once broadly available.

## Not planned

- `usePosture()`: `useHingeSelector((hinge) => hinge.posture)` already covers it.
- Custom SwiftUI arrangement styles: they are Swift-only and cannot be driven from JS.
