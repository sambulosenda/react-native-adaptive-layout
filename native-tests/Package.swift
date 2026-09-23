// swift-tools-version: 6.0
import PackageDescription

// Tests the SwiftUI host in isolation. `Sources/RNFoldableHost` symlinks the shipped
// `ios/FoldableLayoutHost.swift`, which imports only SwiftUI and UIKit, so no React Native
// build is needed. The Fabric (.mm) layer stays covered by the example app.
//
// The adaptive path compiles only with `-DRNF_HAS_ARRANGEMENT_API` (iOS 27.1+ SDK), which
// callers pass through `OTHER_SWIFT_FLAGS`, mirroring RNFoldable.podspec.
let package = Package(
  name: "RNFoldableNativeTests",
  platforms: [.iOS(.v17)],
  targets: [
    .target(name: "RNFoldableHost", swiftSettings: [.swiftLanguageMode(.v5)]),
    .testTarget(
      name: "RNFoldableHostTests",
      dependencies: ["RNFoldableHost"],
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
  ]
)
