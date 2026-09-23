# Release QA

CI covers JS, the compact fallback, and the example build. It cannot run the adaptive path (it
needs the iOS 27.1 SDK and runtime), so run this checklist by hand before every release that
touches `ios/` or `src/native/`, and paste the result into the release PR.

## Setup

- Xcode 27.1+, iPhone Duo simulator on an iOS 27.1+ runtime.
- `yarn example prebuild && yarn example ios` (Debug, so `RCTAssert` is active).
- `yarn test:native` passes both builds, including "Arrangement API build".

Every step also checks: no redbox, no `RCTAssert` failure, no Xcode runtime warnings.

## 1. Adaptive path is live

- [ ] Both panes show a hinge reading (posture and angle), not "hinge unavailable".
- [ ] Moving the hinge updates the angle continuously; posture changes only at OS transitions.
- [ ] Posture shown is one of `closed`, `partiallyOpen`, `fullyOpen`, `unknown`.

## 2. Split mode

| Posture        | `splitRatio` | Expect                                                          |
| -------------- | ------------ | --------------------------------------------------------------- |
| fully open     | auto         | System-chosen split                                             |
| fully open     | 0.3/0.5/0.7  | Primary size in the example matches the ratio                   |
| partially open | any          | Split follows the fold; the ratio is ignored                    |
| closed         | any          | Cover screen; the system stacks the panes and the ratio applies |

- [ ] `axis` `horizontal` / `vertical` never forces a split; it only restricts the axis. An axis the
      posture cannot split on gives a single pane.
- [ ] Size labels in each pane match the visible pane (Yoga got the native size).

## 3. Overlay mode

- [ ] Fully open: primary floats above the secondary.
- [ ] Partially open: overlay turns side by side.
- [ ] `overlayEdge` `leading` / `trailing` anchors the primary to that edge when side by side;
      `auto` lets the system choose.
- [ ] Taps on empty areas of the floating primary reach the secondary.

## 4. Arrangement

- [ ] `useArrangement` `kind` matches what is on screen after each posture and mode change.
- [ ] A hidden pane reports `visible: false`.

## 5. Stability

- [ ] Pane state (event log) survives posture changes and split ↔ overlay switches.
- [ ] Rotate the device in each mode: layout settles, sizes update, no stale frame.
- [ ] Background and foreground the app: hinge and arrangement still update.

## 6. Fallback

On an iOS runtime below 27.1:

- [ ] Split shows primary only; overlay stacks primary above secondary.
- [ ] Hinge reports unavailable.

## Result

```
Version:
Xcode / SDK:
Simulator / runtime:
Sections passed: 1 2 3 4 5 6
Notes:
```
