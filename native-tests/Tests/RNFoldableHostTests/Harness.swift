import RNFoldableHost
import UIKit

/// Records every delegate call so tests can assert on what the Fabric layer would receive.
final class RecordingDelegate: NSObject, RNFoldableLayoutHostDelegate {
  struct Hinge: Equatable {
    var available: Bool
    var angle: Double
    var posture: String
  }

  struct Pane: Equatable {
    var visible: Bool
    var frame: CGRect
  }

  struct Arrangement: Equatable {
    var size: CGSize
    var primary: Pane
    var secondary: Pane
  }

  private(set) var hinges: [Hinge] = []
  private(set) var arrangements: [Arrangement] = []
  private(set) var placements: [(pane: UIView, frame: CGRect)] = []

  func layoutHost(
    _ host: RNFoldableLayoutHost,
    didUpdateHingeAvailable available: Bool,
    angle: Double,
    posture: String
  ) {
    hinges.append(Hinge(available: available, angle: angle, posture: posture))
  }

  func layoutHost(_ host: RNFoldableLayoutHost, didPlace pane: UIView, frame: CGRect) {
    placements.append((pane, frame))
  }

  func layoutHost(
    _ host: RNFoldableLayoutHost,
    didUpdateArrangementWithSize size: CGSize,
    primaryVisible: Bool,
    primaryFrame: CGRect,
    secondaryVisible: Bool,
    secondaryFrame: CGRect
  ) {
    arrangements.append(
      Arrangement(
        size: size,
        primary: Pane(visible: primaryVisible, frame: primaryFrame),
        secondary: Pane(visible: secondaryVisible, frame: secondaryFrame)
      )
    )
  }
}

/// A host mounted in a real window, with two plain panes, as Fabric would mount it.
@MainActor
final class Fixture {
  static let size = CGSize(width: 400, height: 800)

  let window: UIWindow
  let host: RNFoldableLayoutHost
  let delegate = RecordingDelegate()
  let primary = UIView()
  let secondary = UIView()

  init(mode: String = "split", onScreen: Bool = true) {
    window = UIWindow(frame: CGRect(origin: .zero, size: Self.size))
    window.rootViewController = UIViewController()
    host = RNFoldableLayoutHost(frame: CGRect(origin: .zero, size: Self.size))
    host.delegate = delegate
    apply(mode: mode)
    host.setPrimary(primary, secondary: secondary)
    if onScreen {
      window.rootViewController?.view.addSubview(host)
      window.isHidden = false
    }
  }

  func apply(
    mode: String = "split",
    axis: String = "any",
    trackHinge: Bool = true,
    primaryOverlayEdge: String = "none",
    secondaryOverlayEdge: String = "none",
    splitRatio: Double = 0
  ) {
    host.apply(
      mode: mode,
      axis: axis,
      trackHinge: trackHinge,
      primaryOverlayEdge: primaryOverlayEdge,
      secondaryOverlayEdge: secondaryOverlayEdge,
      splitRatio: splitRatio
    )
  }

  /// Lays out UIKit and SwiftUI, then drains the main queue so coalesced
  /// arrangement updates are delivered.
  func settle() async throws {
    for _ in 0..<3 {
      host.setNeedsLayout()
      host.layoutIfNeeded()
      try await Task.sleep(for: .milliseconds(30))
    }
  }

  var bounds: CGRect { CGRect(origin: .zero, size: Self.size) }
}

/// Whether this build and OS run the adaptive (ArrangementView) tree rather than the
/// compact fallback.
var runsAdaptiveTree: Bool {
  #if RNF_HAS_ARRANGEMENT_API
    if #available(iOS 27.1, *) { return true }
  #endif
  return false
}
