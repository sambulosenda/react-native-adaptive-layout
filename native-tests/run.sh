#!/usr/bin/env bash
# Runs the SwiftUI host tests on an iOS simulator.
#
# Always runs the compact fallback build. When the SDK has the arrangement API (27.1+), also
# runs with RNF_HAS_ARRANGEMENT_API, as RNFoldable.podspec would compile it; on a 27.1+
# runtime that exercises the adaptive tree.
#
# RNF_TEST_SIMULATOR overrides the device (name or UDID). Default: a booted iPhone, else the
# first available iPhone on the newest runtime.
set -euo pipefail
cd "$(dirname "$0")"

simulator="${RNF_TEST_SIMULATOR:-$(xcrun simctl list devices available -j | node -e '
  const { devices } = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const runtimes = Object.keys(devices).filter((r) => r.includes("iOS")).sort().reverse();
  const phones = runtimes.flatMap((r) => devices[r].filter((d) => d.name.startsWith("iPhone")));
  const pick = phones.find((d) => d.state === "Booted") ?? phones[0];
  if (!pick) process.exit(1);
  console.log(pick.udid);
')}"

destination="platform=iOS Simulator,id=$simulator"
if [[ "$simulator" != *-*-*-*-* ]]; then destination="platform=iOS Simulator,name=$simulator"; fi

run() {
  echo "==> $1"
  shift
  xcodebuild test -quiet -scheme RNFoldableNativeTests-Package -destination "$destination" \
    -derivedDataPath .build/xcode "$@"
}

run "Compact fallback build"

sdk="$(xcrun --sdk iphonesimulator --show-sdk-version)"
if [[ "$(printf '%s\n27.1\n' "$sdk" | sort -V | head -1)" == "27.1" ]]; then
  run "Arrangement API build (SDK $sdk)" OTHER_SWIFT_FLAGS='$(inherited) -DRNF_HAS_ARRANGEMENT_API'
else
  echo "==> Skipping arrangement API build: SDK $sdk < 27.1"
fi
