#pragma once

#include <react/renderer/components/RNFoldableSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/// Geometry assigned by SwiftUI, mirrored into the shadow tree.
struct RNFoldablePaneState {
  Size size{};
  Point origin{};
  bool measured{false};
};

inline constexpr char RNFoldablePaneComponentName[] = "RNFoldablePane";

using RNFoldablePaneShadowNodeBase = ConcreteViewShadowNode<
    RNFoldablePaneComponentName,
    RNFoldablePaneProps,
    ViewEventEmitter,
    RNFoldablePaneState>;

/// A pane's size comes from native state (applied in `adopt`), not from its
/// Yoga parent. It is deliberately *not* a `RootNodeKind`: React Native stops
/// walking ancestors at root nodes when measuring, which would make
/// `measureInWindow` / `measure` inside a pane ignore the layout's own offset.
class RNFoldablePaneShadowNode final : public RNFoldablePaneShadowNodeBase {
 public:
  using RNFoldablePaneShadowNodeBase::RNFoldablePaneShadowNodeBase;

  Point getContentOriginOffset(bool /*includeTransform*/) const override {
    return getStateData().origin;
  }
};

class RNFoldablePaneComponentDescriptor final
    : public ConcreteComponentDescriptor<RNFoldablePaneShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode &shadowNode) const override {
    auto &pane = static_cast<RNFoldablePaneShadowNode &>(shadowNode);
    const auto &state = pane.getStateData();
    if (state.measured) {
      pane.setSize(state.size);
    }
    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
