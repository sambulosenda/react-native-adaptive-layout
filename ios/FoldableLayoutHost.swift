import Combine
import SwiftUI
import UIKit

// MARK: - Model

/// Mutable configuration shared between the Fabric view and the SwiftUI tree.
/// Every mutation goes through `RNFoldableLayoutHost` so the SwiftUI body is
/// invalidated exactly once per prop commit.
private final class LayoutModel: ObservableObject {
  enum Mode: String { case split, overlay }
  enum Axis: String {
    case any, horizontal, vertical

    var axisSet: SwiftUI.Axis.Set {
      switch self {
      case .horizontal: return .horizontal
      case .vertical: return .vertical
      case .any: return [.horizontal, .vertical]
      }
    }
  }

  @Published var mode: Mode = .split
  @Published var axis: Axis = .any
  @Published var trackHinge = true
  @Published var primary: UIView?
  @Published var secondary: UIView?

  weak var host: RNFoldableLayoutHost?
}

// MARK: - Pane hosting

/// UIKit container that adopts a React-managed pane view and reports the frame
/// SwiftUI assigns to it, in host coordinates, back to the Fabric layer.
private final class PaneContainer: UIView {
  let pane: UIView
  private weak var model: LayoutModel?

  init(pane: UIView, model: LayoutModel) {
    self.pane = pane
    self.model = model
    super.init(frame: .zero)
    clipsToBounds = true
    addSubview(pane)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("PaneContainer is code-only") }

  override func layoutSubviews() {
    super.layoutSubviews()
    guard let host = model?.host else { return }
    host.delegate?.layoutHost(host, didPlace: pane, frame: convert(bounds, to: host))
  }

  /// The container itself is never a hit target; touches fall through to React
  /// content or, in overlay mode, to the pane underneath.
  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let hit = super.hitTest(point, with: event)
    return hit === self ? nil : hit
  }
}

private struct PaneSlot: UIViewRepresentable {
  let pane: UIView
  let model: LayoutModel

  func makeUIView(context: Context) -> PaneContainer {
    PaneContainer(pane: pane, model: model)
  }

  func updateUIView(_ container: PaneContainer, context: Context) {
    container.setNeedsLayout()
  }

  func sizeThatFits(_ proposal: ProposedViewSize, uiView: PaneContainer, context: Context) -> CGSize? {
    CGSize(width: proposal.width ?? 0, height: proposal.height ?? 0)
  }

  static func dismantleUIView(_ container: PaneContainer, coordinator: ()) {
    // A mode switch may have re-parented the pane into a fresh container already.
    if container.pane.superview === container {
      container.pane.removeFromSuperview()
    }
  }
}

// MARK: - SwiftUI tree

private struct LayoutRoot: View {
  @ObservedObject var model: LayoutModel

  @ViewBuilder private var primary: some View {
    if let pane = model.primary { PaneSlot(pane: pane, model: model) }
  }

  @ViewBuilder private var secondary: some View {
    if let pane = model.secondary { PaneSlot(pane: pane, model: model) }
  }

  var body: some View {
    #if RNF_HAS_ARRANGEMENT_API
      if #available(iOS 27.1, *) {
        adaptive
      } else {
        compact
      }
    #else
      compact
    #endif
  }

  #if RNF_HAS_ARRANGEMENT_API
    @available(iOS 27.1, *)
    @ViewBuilder private var adaptive: some View {
      arrangement
        .onHingeChange(isEnabled: model.trackHinge) { _, context in
          guard let hinge = context.hinge else {
            report(available: false, angle: 0, posture: "unknown")
            return
          }
          let posture: String
          switch hinge.status {
          case .closed: posture = "closed"
          case .partiallyOpen: posture = "partiallyOpen"
          case .fullyOpen: posture = "fullyOpen"
          default: posture = "unknown"
          }
          report(available: true, angle: hinge.angle.radians, posture: posture)
        }
    }

    @available(iOS 27.1, *)
    @ViewBuilder private var arrangement: some View {
      switch model.mode {
      case .split:
        ArrangementView { primary } secondary: { secondary }
          .arrangementViewStyle(.split.axes(model.axis.axisSet))
      case .overlay:
        ArrangementView { primary } secondary: { secondary }
          .arrangementViewStyle(.overlay.axes(model.axis.axisSet))
      }
    }
  #endif

  /// Deterministic behaviour on OS versions without arrangement support: the
  /// primary pane fills the space; overlay stacks the primary above the
  /// secondary. Both React subtrees stay mounted either way.
  @ViewBuilder private var compact: some View {
    switch model.mode {
    case .split: primary
    case .overlay: ZStack { secondary; primary }
    }
  }

  private func report(available: Bool, angle: Double, posture: String) {
    guard let host = model.host else { return }
    host.delegate?.layoutHost(host, didUpdateHingeAvailable: available, angle: angle, posture: posture)
  }
}

// MARK: - Host

@objc public protocol RNFoldableLayoutHostDelegate: AnyObject {
  func layoutHost(
    _ host: RNFoldableLayoutHost,
    didUpdateHingeAvailable available: Bool,
    angle: Double,
    posture: String
  )
  func layoutHost(_ host: RNFoldableLayoutHost, didPlace pane: UIView, frame: CGRect)
}

/// The UIKit boundary between Fabric and SwiftUI. Owns a `UIHostingController`
/// whose lifecycle follows the nearest ancestor view controller, so SwiftUI
/// receives scene, hinge and trait updates.
@objc public final class RNFoldableLayoutHost: UIView {
  @objc public weak var delegate: RNFoldableLayoutHostDelegate?

  private let model = LayoutModel()
  private let controller: UIHostingController<LayoutRoot>

  @objc public override init(frame: CGRect) {
    controller = UIHostingController(rootView: LayoutRoot(model: model))
    super.init(frame: frame)
    model.host = self
    controller.safeAreaRegions = []
    controller.view.backgroundColor = .clear
    clipsToBounds = true
    addSubview(controller.view)
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) { fatalError("RNFoldableLayoutHost is code-only") }

  // MARK: Inputs

  @objc public func setPrimary(_ primary: UIView?, secondary: UIView?) {
    if model.primary !== primary { model.primary = primary }
    if model.secondary !== secondary { model.secondary = secondary }
  }

  @objc public func apply(mode: String, axis: String, trackHinge: Bool) {
    let nextMode = LayoutModel.Mode(rawValue: mode) ?? .split
    let nextAxis = LayoutModel.Axis(rawValue: axis) ?? .any
    if model.mode != nextMode { model.mode = nextMode }
    if model.axis != nextAxis { model.axis = nextAxis }
    if model.trackHinge != trackHinge {
      model.trackHinge = trackHinge
      if !trackHinge {
        delegate?.layoutHost(self, didUpdateHingeAvailable: false, angle: 0, posture: "unknown")
      }
    }
  }

  // MARK: Lifecycle

  public override func layoutSubviews() {
    super.layoutSubviews()
    attachToParentController()
    controller.view.frame = bounds
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    if window == nil { detachFromParentController() } else { attachToParentController() }
  }

  private func attachToParentController() {
    guard window != nil, let parent = nearestViewController() else { return }
    guard controller.parent !== parent else { return }
    detachFromParentController()
    parent.addChild(controller)
    controller.didMove(toParent: parent)
  }

  private func detachFromParentController() {
    guard controller.parent != nil else { return }
    controller.willMove(toParent: nil)
    controller.removeFromParent()
  }

  private func nearestViewController() -> UIViewController? {
    var responder: UIResponder? = superview
    while let current = responder {
      if let controller = current as? UIViewController { return controller }
      responder = current.next
    }
    return nil
  }
}
