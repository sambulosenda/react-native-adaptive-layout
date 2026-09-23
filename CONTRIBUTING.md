# Contributing

Thanks for helping build react-native-adaptive-layout. This guide gets you from clone to merged PR.

## Prerequisites

- Node ≥ 20 (see `.nvmrc`), Yarn 4 via Corepack (`corepack enable`)
- Xcode 27.1+ with an iOS 27.1 simulator runtime (iPhone Duo for hinge testing)
- CocoaPods (`brew install cocoapods`). On Ruby 4 export `LANG=en_US.UTF-8` before `pod install`.

## Setup

```sh
git clone https://github.com/sambulosenda/react-native-foldable
cd react-native-foldable
yarn                      # installs deps, builds lib, installs git hooks
yarn example prebuild     # generates example/ios
yarn example ios          # builds and launches on a simulator
```

## Repository layout

```
src/            TypeScript public API and JS-side logic
src/native/     Codegen specs (the only files codegen reads)
ios/            Swift host + Fabric component views + shadow node
tests/          Vitest unit tests for platform-independent logic
example/        Expo dev-client app that exercises every prop
docs/           Architecture, ADRs, roadmap
```

Read [docs/architecture.md](docs/architecture.md) before touching native code.

## Development loop

| Task                 | Command                       |
| -------------------- | ----------------------------- |
| Type-check           | `yarn typecheck`              |
| Lint + format        | `yarn lint` / `yarn lint:fix` |
| Unit tests           | `yarn test`                   |
| Build library output | `yarn build`                  |
| Run example          | `yarn example ios`            |

JS changes hot-reload in the example through Metro. Native changes need `yarn example ios` again.
Changing a codegen spec in `src/native` requires `yarn example prebuild` to regenerate.

## Making changes

1. Branch from `main`.
2. Keep PRs focused. Refactors and behaviour changes go in separate PRs.
3. Add or update tests for JS logic. Native changes must be verified in the example app; say how in the PR.
   Before a release that touches native code, run [docs/release-qa.md](docs/release-qa.md).
4. Add a changeset for anything user-facing: `yarn changeset`.
5. Update docs (README, ADRs) in the same PR as the code they describe.

### Commit messages

Conventional Commits, enforced by commitlint:

```
feat(ios): report hinge posture changes
fix(core): ignore duplicate Secondary slots
docs: explain overlay hit-testing
```

Scopes: `core`, `ios`, `android`, `example`, `docs`, `ci`, `deps`, `release`, `tooling`.

### Code style

Biome handles formatting and linting for JS/TS; the pre-commit hook runs it. Swift follows the
default Xcode formatter with two-space indent. ObjC++ files mirror React Native's own style.

Public API rules:

- Everything exported from `src/index.ts` is public and semver-protected.
- Prefer additive changes. Deprecate with a warning for one minor before removing.
- Never infer hardware state; report what the OS reports or `unknown`.

### Native changes

- Anything that needs the iOS 27.1 SDK must live behind `#if RNF_HAS_ARRANGEMENT_API` and a runtime
  `#available` check so the library still compiles and runs on older toolchains.
- The Fabric layer (`RNFoldable*View.mm`) should stay thin: marshal props/events, nothing else.
- Layout decisions belong in SwiftUI (`FoldableLayoutHost.swift`), never in UIKit or React.

## Adding Android

Android is the next milestone. See [docs/roadmap.md](docs/roadmap.md) for the intended design and
the contract the JS layer already expects. Open an issue before starting so we can coordinate.

## Releasing

Maintainers only. Merging the "Version Packages" PR opened by the release workflow publishes to
npm and creates a GitHub release.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
