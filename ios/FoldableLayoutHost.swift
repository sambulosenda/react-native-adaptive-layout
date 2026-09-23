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

  /// Edge a pane is anchored to when an overlay turns side-by-side.
  /// `none` leaves the choice to the system.
  enum Edge: String {
    case none, leading, trailing

    var horizontalEdge: HorizontalEdge? {
      switch self {
      case .none: return nil
      case .leading: return .leading
      case .trailing: return .trailing
      }
    }
  }

  @Published var mode: Mode = .split
  @Published var axis: Axis = .any
  @Published var trackHinge = true
  @Published var primaryOverlayEdge: Edge = .none
  @Published var secondaryOverlayEdge: Edge = .none
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

  /// A mode switch can re-parent the pane into a fresh container while this
  /// one is still alive; only the current owner may report for the pane.
  private var ownsPane: Bool { pane.superview === self }

  override func layoutSubviews() {
    super.layoutSubviews()
    guard let host = model?.host, ownsPane else { return }
    let frame = convert(bounds, to: host)
    host.delegate?.layoutHost(host, didPlace: pane, frame: frame)
    host.recordPane(pane, visible: window != nil, frame: frame)
  }

  /// SwiftUI hides a pane by detaching its container from the window and leaves
  /// the last frame in place, so window attachment is the visibility signal.
  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard let host = model?.host, ownsPane else { return }
    host.recordPane(pane, visible: window != nil, frame: window != nil ? convert(bounds, to: host) : nil)
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
        ArrangementView {
          primary.overlayArrangementEdge(model.primaryOverlayEdge.horizontalEdge)
        } secondary: {
          secondary.overlayArrangementEdge(model.secondaryOverlayEdge.horizontalEdge)
        }
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
  func layoutHost(
    _ host: RNFoldableLayoutHost,
    didUpdateArrangementWithSize size: CGSize,
    primaryVisible: Bool,
    primaryFrame: CGRect,
    secondaryVisible: Bool,
    secondaryFrame: CGRect
  )
}

/// The UIKit boundary between Fabric and SwiftUI. Owns a `UIHostingController`
/// whose lifecycle follows the nearest ancestor view controller, so SwiftUI
/// receives scene, hinge and trait updates.
@objc public final class RNFoldableLayoutHost: UIView {
  @objc public weak var delegate: RNFoldableLayoutHostDelegate?

  private let model = LayoutModel()
  private let controller: UIHostingController<LayoutRoot>

  /// Last known geometry of each pane, in host coordinates. A hidden pane keeps
  /// its previous frame; consumers only read frames of visible panes.
  private struct PaneGeometry: Equatable {
    var visible = false
    var frame = CGRect.zero
  }

  private struct Arrangement: Equatable {
    var size = CGSize.zero
    var primary = PaneGeometry()
    var secondary = PaneGeometry()
  }

  private var arrangement = Arrangement()
  private var lastEmittedArrangement: Arrangement?
  private var arrangementScheduled = false

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
    if model.primary !== primary {
      model.primary = primary
      arrangement.primary = PaneGeometry()
      scheduleArrangement()
    }
    if model.secondary !== secondary {
      model.secondary = secondary
      arrangement.secondary = PaneGeometry()
      scheduleArrangement()
    }
  }

  // MARK: Arrangement

  /// Records a pane's visibility and, when known, its frame. Updates are
  /// coalesced to one delegate call per run-loop turn and de-duplicated.
  func recordPane(_ pane: UIView, visible: Bool, frame: CGRect?) {
    var geometry: PaneGeometry
    if pane === model.primary {
      geometry = arrangement.primary
    } else if pane === model.secondary {
      geometry = arrangement.secondary
    } else {
      return
    }
    geometry.visible = visible
    if let frame { geometry.frame = frame }
    if pane === model.primary { arrangement.primary = geometry } else { arrangement.secondary = geometry }
    scheduleArrangement()
  }

  private func scheduleArrangement() {
    guard !arrangementScheduled else { return }
    arrangementScheduled = true
    DispatchQueue.main.async { [weak self] in self?.emitArrangement() }
  }

  private func emitArrangement() {
    arrangementScheduled = false
    guard window != nil else { return }
    arrangement.size = bounds.size
    guard arrangement != lastEmittedArrangement else { return }
    lastEmittedArrangement = arrangement
    delegate?.layoutHost(
      self,
      didUpdateArrangementWithSize: arrangement.size,
      primaryVisible: arrangement.primary.visible,
      primaryFrame: arrangement.primary.frame,
      secondaryVisible: arrangement.secondary.visible,
      secondaryFrame: arrangement.secondary.frame
    )
  }

  @objc public func apply(
    mode: String,
    axis: String,
    trackHinge: Bool,
    primaryOverlayEdge: String,
    secondaryOverlayEdge: String
  ) {
    let nextMode = LayoutModel.Mode(rawValue: mode) ?? .split
    let nextAxis = LayoutModel.Axis(rawValue: axis) ?? .any
    let nextPrimaryEdge = LayoutModel.Edge(rawValue: primaryOverlayEdge) ?? .none
    let nextSecondaryEdge = LayoutModel.Edge(rawValue: secondaryOverlayEdge) ?? .none
    if model.mode != nextMode { model.mode = nextMode }
    if model.axis != nextAxis { model.axis = nextAxis }
    if model.primaryOverlayEdge != nextPrimaryEdge { model.primaryOverlayEdge = nextPrimaryEdge }
    if model.secondaryOverlayEdge != nextSecondaryEdge { model.secondaryOverlayEdge = nextSecondaryEdge }
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
    scheduleArrangement()
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
