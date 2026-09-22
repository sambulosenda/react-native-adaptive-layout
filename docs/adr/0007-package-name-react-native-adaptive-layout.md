# 0007. Publish as react-native-adaptive-layout

Date: 2026-09-22
Status: Accepted

## Context

The package was named `react-native-foldable`, but that npm name is owned by an unrelated package
(v0.0.1, different maintainer), so the first release could not be published under it.

The library's capability is an adaptive two-pane layout. Foldables are one environment for it; iPad
Split View, Stage Manager and large Android screens use the same arrangement model, and the JS API
is intended to stay platform-neutral.

## Decision

Publish as `react-native-adaptive-layout`: named after the capability rather than a device class,
free of platform terms, and available on npm. Discoverability for "foldable" searches comes from the
`keywords` field (`foldable`, `hinge`, `iphone-duo`).

Renamed: the npm name, imports in docs and the example, the source export condition
(`react-native-adaptive-layout-source`), the example workspace
(`react-native-adaptive-layout-example`), and the development warning prefix.

Unchanged:

- Exported API names (`FoldableLayout`, `useHinge`, …). Renaming them would break imports for no
  functional gain; any API rename gets its own ADR before 1.0.
- Native identifiers (`RNFoldable` pod, `RNFoldableSpec`, `RNFoldableLayout` / `RNFoldablePane`
  components). They are the native contract and invisible to consumers.
- The GitHub repository name. GitHub redirects old URLs if it is renamed later.

## Consequences

- The first published version (0.2.0) ships as `react-native-adaptive-layout`; nothing was ever
  published under the old name, so no deprecation is needed.
- `FoldableLayout` inside `react-native-adaptive-layout` is a slight naming mismatch, accepted for
  now.
