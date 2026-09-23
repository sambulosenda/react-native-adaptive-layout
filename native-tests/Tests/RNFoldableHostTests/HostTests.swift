import RNFoldableHost
import Testing
import UIKit

@MainActor
@Suite("Hinge reporting")
struct HingeTests {
  @Test("Turning trackHinge off reports the hinge as unavailable once")
  func trackHingeOff() {
    let fixture = Fixture(onScreen: false)
    fixture.apply(trackHinge: false)
    fixture.apply(trackHinge: false)
    #expect(fixture.delegate.hinges == [.init(available: false, angle: 0, posture: "unknown")])
  }

  @Test("Turning trackHinge on does not report on its own")
  func trackHingeOn() {
    let fixture = Fixture(onScreen: false)
    fixture.apply(trackHinge: false)
    fixture.apply(trackHinge: true)
    #expect(fixture.delegate.hinges.count == 1)
  }
}

@MainActor
@Suite("Arrangement events")
struct ArrangementEventTests {
  @Test("Nothing is emitted while the host is off screen")
  func offScreen() async throws {
    let fixture = Fixture(onScreen: false)
    try await fixture.settle()
    #expect(fixture.delegate.arrangements.isEmpty)
  }

  @Test("Updates are coalesced and an unchanged arrangement is not re-emitted")
  func coalescedAndDeduplicated() async throws {
    let fixture = Fixture()
    try await fixture.settle()
    #expect(fixture.delegate.arrangements.count == 1)
    #expect(fixture.delegate.arrangements.last?.size == Fixture.size)

    fixture.apply()
    try await fixture.settle()
    #expect(fixture.delegate.arrangements.count == 1)
  }
}

@MainActor
@Suite("Compact fallback", .enabled(if: !runsAdaptiveTree, "Adaptive tree is active on this OS"))
struct CompactFallbackTests {
  @Test("Split: the primary fills the layout and the secondary is not shown")
  func split() async throws {
    let fixture = Fixture(mode: "split")
    try await fixture.settle()
    let last = try #require(fixture.delegate.arrangements.last)
    #expect(last.primary == .init(visible: true, frame: fixture.bounds))
    #expect(last.secondary.visible == false)
    #expect(fixture.secondary.window == nil)
  }

  @Test("Overlay: both panes fill the layout, primary on top")
  func overlay() async throws {
    let fixture = Fixture(mode: "overlay")
    try await fixture.settle()
    let last = try #require(fixture.delegate.arrangements.last)
    #expect(last.primary == .init(visible: true, frame: fixture.bounds))
    #expect(last.secondary == .init(visible: true, frame: fixture.bounds))
  }

  @Test("An unknown mode falls back to split")
  func unknownMode() async throws {
    let fixture = Fixture(mode: "diagonal")
    try await fixture.settle()
    let last = try #require(fixture.delegate.arrangements.last)
    #expect(last.primary.visible == true)
    #expect(last.secondary.visible == false)
  }

  @Test("Switching modes keeps the same pane views mounted")
  func modeSwitchKeepsPanes() async throws {
    let fixture = Fixture(mode: "split")
    try await fixture.settle()
    fixture.apply(mode: "overlay")
    try await fixture.settle()
    #expect(fixture.secondary.window != nil)
    fixture.apply(mode: "split")
    try await fixture.settle()

    #expect(fixture.primary.window != nil)
    let last = try #require(fixture.delegate.arrangements.last)
    #expect(last.primary == .init(visible: true, frame: fixture.bounds))
    #expect(last.secondary.visible == false)
  }

  @Test("Touches outside the top pane's content fall through to the pane below")
  func overlayHitTestPassesThrough() async throws {
    let fixture = Fixture(mode: "overlay")
    try await fixture.settle()
    fixture.primary.frame = CGRect(x: 0, y: 0, width: 10, height: 10)
    fixture.secondary.frame = fixture.bounds

    let center = CGPoint(x: fixture.bounds.midX, y: fixture.bounds.midY)
    #expect(fixture.host.hitTest(center, with: nil) === fixture.secondary)
    #expect(fixture.host.hitTest(CGPoint(x: 5, y: 5), with: nil) === fixture.primary)
  }
}

@MainActor
@Suite("Adaptive tree", .enabled(if: runsAdaptiveTree, "Needs the iOS 27.1 SDK and runtime"))
struct AdaptiveTreeTests {
  @Test("Split: visible panes lie inside the layout and do not overlap", arguments: ["any", "horizontal", "vertical"])
  func split(axis: String) async throws {
    let fixture = Fixture(mode: "split")
    fixture.apply(mode: "split", axis: axis)
    try await fixture.settle()
    let last = try #require(fixture.delegate.arrangements.last)
    #expect(last.primary.visible || last.secondary.visible)
    for pane in [last.primary, last.secondary] where pane.visible {
      #expect(fixture.bounds.contains(pane.frame))
    }
    if last.primary.visible && last.secondary.visible {
      #expect(!last.primary.frame.intersection(last.secondary.frame).hasNonZeroArea)
    }
  }

  @Test("Overlay: the primary pane is shown")
  func overlay() async throws {
    let fixture = Fixture(mode: "overlay")
    try await fixture.settle()
    let last = try #require(fixture.delegate.arrangements.last)
    #expect(last.primary.visible)
  }

  @Test("Switching modes rebuilds the arrangement without losing a mounted pane")
  func modeSwitchKeepsPanes() async throws {
    let fixture = Fixture(mode: "split")
    try await fixture.settle()
    fixture.apply(mode: "overlay")
    try await fixture.settle()
    fixture.apply(mode: "split")
    try await fixture.settle()

    let last = try #require(fixture.delegate.arrangements.last)
    #expect(last.primary.visible == (fixture.primary.window != nil))
    #expect(last.secondary.visible == (fixture.secondary.window != nil))
    #expect(last.primary.visible)
  }
}

extension CGRect {
  fileprivate var hasNonZeroArea: Bool { !isNull && width > 0.5 && height > 0.5 }
}
