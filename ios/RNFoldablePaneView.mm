#import "RNFoldablePaneView.h"
#import "RNFoldablePaneShadowNode.h"

using namespace facebook::react;

@implementation RNFoldablePaneView {
  RNFoldablePaneShadowNode::ConcreteState::Shared _state;
  CGRect _nativeFrame;
  BOOL _hasNativeFrame;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNFoldablePaneComponentDescriptor>();
}

+ (BOOL)shouldBeRecycled
{
  return NO;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const RNFoldablePaneProps>();
    self.clipsToBounds = YES;
  }
  return self;
}

- (void)applyNativeFrame:(CGRect)frame
{
  _nativeFrame = frame;
  _hasNativeFrame = YES;
  // The pane lives inside a SwiftUI container that is already positioned, so
  // only its size is applied here; the origin is published to the shadow tree
  // for correct hit-testing and measurement of descendants.
  self.frame = (CGRect){CGPointZero, frame.size};
  [self publishState];
}

- (void)publishState
{
  if (!_state || !_hasNativeFrame) {
    return;
  }
  const auto &current = _state->getData();
  const facebook::react::Size size{(Float)_nativeFrame.size.width, (Float)_nativeFrame.size.height};
  const facebook::react::Point origin{(Float)_nativeFrame.origin.x, (Float)_nativeFrame.origin.y};
  if (current.measured && current.size == size && current.origin == origin) {
    return;
  }
  _state->updateState(RNFoldablePaneState{size, origin, true});
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  [super updateState:state oldState:oldState];
  _state = std::static_pointer_cast<const RNFoldablePaneShadowNode::ConcreteState>(state);
  [self publishState];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  // SwiftUI owns this frame. Fabric still needs metrics for descendants and
  // onLayout, but a stale commit must never resize the native pane.
  auto pinned = layoutMetrics;
  if (_hasNativeFrame) {
    pinned.frame = {{0, 0}, {(Float)_nativeFrame.size.width, (Float)_nativeFrame.size.height}};
  }
  [super updateLayoutMetrics:pinned oldLayoutMetrics:oldLayoutMetrics];
}

@end
