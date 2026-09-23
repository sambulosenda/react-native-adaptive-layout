# Architecture

## Goals

1. Let the platform decide layout. The OS knows the hinge, the posture, and the user's preference;
   the library only declares intent (`mode`, `axis`).
2. Keep React content stable. Pane subtrees are mounted once and re-parented natively; state is
   never lost across posture changes.
3. Degrade deterministically. Every environment renders something predictable and reports the
   hinge honestly as unavailable.
4. Keep the Fabric layer thin so future platforms can share the JS contract.

## Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│ React                                                                │
│  FoldableLayout ─ resolves slots ─ owns a HingeStore (Context)       │
│  useHinge / useHingeSelector ─ useSyncExternalStore on nearest store │
├──────────────────────────────────────────────────────────────────────┤
│ Codegen (src/native)                                                 │
│  RNFoldableLayout  props: mode, axis, trackHinge  event: onHingeUpdate│
│                    primaryOverlayEdge, secondaryOverlayEdge,         │
│                    splitRatio                                        │
│  RNFoldablePane    interfaceOnly; custom shadow node                 │
├──────────────────────────────────────────────────────────────────────┤
│ Fabric (ios/RNFoldable*View.mm, RNFoldablePaneShadowNode.h)          │
│  Marshals props/events; publishes SwiftUI-assigned pane geometry     │
│  into shadow state so Yoga lays out descendants correctly            │
├──────────────────────────────────────────────────────────────────────┤
│ SwiftUI (ios/FoldableLayoutHost.swift)                               │
│  UIHostingController → ArrangementView + onHingeChange               │
│  PaneSlot (UIViewRepresentable) adopts each React pane view          │
└──────────────────────────────────────────────────────────────────────┘
```

## Data flow

**Props down.** `FoldableLayout` → codegen props → `RNFoldableLayoutView.updateProps` →
`RNFoldableLayoutHost.apply(mode:axis:trackHinge:primaryOverlayEdge:secondaryOverlayEdge:splitRatio:)` → `LayoutModel` (`ObservableObject`) →
SwiftUI re-renders.

**Panes down.** React renders two `RNFoldablePane` children, always primary first. Fabric mounts
them by index; the host assigns index 0 to the primary slot and index 1 to the secondary slot.
SwiftUI then re-parents each `UIView` into a `PaneContainer`.

**Geometry up.** When SwiftUI lays out a `PaneContainer`, it reports the container's frame in host
coordinates. `RNFoldablePaneView.applyNativeFrame` sets the UIKit frame and writes a
`RNFoldablePaneState` into the shadow tree. The pane's shadow node is a `RootNodeKind` whose size
comes from that state, so Yoga measures descendants against the real size, and
`getContentOriginOffset` keeps hit-testing and `measureInWindow` accurate.

**Arrangement up.** `PaneContainer.didMoveToWindow` (visibility: SwiftUI detaches hidden panes) and
`layoutSubviews` (frame) → `RNFoldableLayoutHost.recordPane` → coalesced, de-duplicated
`onArrangementUpdate` → `toArrangement` → arrangement store → `useArrangement` subscribers.

**Hinge up.** `.onHingeChange` → `LayoutRoot.report` → host delegate →
`RNFoldableLayoutView` → `onHingeUpdate` direct event → `toHingeState` → `HingeStore.publish` →
subscribers re-render.

## Why one store per layout

Hinge events belong to a scene. Two layouts in different windows on the same device could observe
different states. A per-layout store, provided through Context, scopes events correctly and keeps
`useHinge` free of global state.

## Why the shadow node owns pane size

Yoga cannot know where SwiftUI will put a pane. Without state feedback, `onLayout` and
`measure*` would report the container's full size and touch targets would be misaligned.
Pushing native geometry into shadow state is the same technique React Native uses for
`ScrollView` content offset and native text measurement.

## Compile-time gating

The arrangement and hinge APIs exist only in the iOS 27.1 SDK. Swift cannot compile references to
symbols the SDK does not declare, so `RNFoldable.podspec` sets `RNF_HAS_ARRANGEMENT_API` when the
active SDK is new enough. Inside that flag a runtime `#available(iOS 27.1, *)` check chooses
between the adaptive tree and the compact fallback.

## Fallbacks

| Situation            | Split          | Overlay                        |
| -------------------- | -------------- | ------------------------------ |
| iOS < 27.1 / old SDK | Primary fills  | Primary stacked over secondary |
| Android / web        | Primary fills  | Primary fills                  |

The secondary React tree stays mounted in every fallback.

## Adding a platform

1. Implement `RNFoldableLayout` and `RNFoldablePane` against the codegen specs in `src/native`.
2. Honour the pane-index contract (0 = primary, 1 = secondary).
3. Emit `onHingeUpdate` with `{ available, angle (radians), posture }`, and `onArrangementUpdate`
   with each pane's visibility and frame in layout coordinates. Without it `useArrangement` stays
   `unknown`.
4. Replace the platform's fallback file in `src/layout` (e.g. `FoldableLayout.android.tsx`).
5. Document the platform in README's behaviour table and add an ADR.
