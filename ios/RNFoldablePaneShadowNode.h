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

/// A pane is a layout root: its size comes from native state, not from its
/// Yoga parent, and its children are laid out relative to that size.
class RNFoldablePaneShadowNode final : public RNFoldablePaneShadowNodeBase {
 public:
  using RNFoldablePaneShadowNodeBase::RNFoldablePaneShadowNodeBase;

  static ShadowNodeTraits BaseTraits() {
    auto traits = RNFoldablePaneShadowNodeBase::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    return traits;
  }

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
