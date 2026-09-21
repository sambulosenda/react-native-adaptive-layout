require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name          = "RNFoldable"
  s.version       = package["version"]
  s.summary       = package["description"]
  s.homepage      = package["homepage"]
  s.license       = package["license"]
  s.authors       = package["author"]
  s.source        = { :git => package["repository"]["url"], :tag => "v#{s.version}" }

  s.platforms     = { :ios => "16.4" }
  s.swift_version = "5.9"
  s.frameworks    = "SwiftUI"

  s.source_files         = "ios/**/*.{h,m,mm,swift}"
  s.private_header_files = "ios/**/*.h"

  # The arrangement and hinge APIs exist only in the iOS 27.1+ SDK. Runtime
  # `#available` checks cannot compile symbols the SDK does not declare, so the
  # adaptive code path is gated on the SDK used for the build.
  sdk_version = `xcrun --sdk iphoneos --show-sdk-version 2>/dev/null`.strip
  has_arrangement_api = !sdk_version.empty? && Gem::Version.new(sdk_version) >= Gem::Version.new("27.1")

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_ACTIVE_COMPILATION_CONDITIONS" => "$(inherited) #{has_arrangement_api ? 'RNF_HAS_ARRANGEMENT_API' : ''}".strip,
  }

  install_modules_dependencies(s)
end
