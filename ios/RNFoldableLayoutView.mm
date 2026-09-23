#import "RNFoldableLayoutView.h"
#import "RNFoldablePaneView.h"
#import "RNFoldable-Swift.h"

#import <React/RCTAssert.h>

#import <react/renderer/components/RNFoldableSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNFoldableSpec/EventEmitters.h>
#import <react/renderer/components/RNFoldableSpec/Props.h>

using namespace facebook::react;

static NSString *RNFoldableModeName(RNFoldableLayoutMode mode)
{
  return mode == RNFoldableLayoutMode::Overlay ? @"overlay" : @"split";
}

static NSString *RNFoldableAxisName(RNFoldableLayoutAxis axis)
{
  switch (axis) {
    case RNFoldableLayoutAxis::Horizontal: return @"horizontal";
    case RNFoldableLayoutAxis::Vertical: return @"vertical";
    case RNFoldableLayoutAxis::Any: return @"any";
  }
  return @"any";
}

static NSString *RNFoldableEdgeName(RNFoldableLayoutPrimaryOverlayEdge edge)
{
  switch (edge) {
    case RNFoldableLayoutPrimaryOverlayEdge::Leading: return @"leading";
    case RNFoldableLayoutPrimaryOverlayEdge::Trailing: return @"trailing";
    case RNFoldableLayoutPrimaryOverlayEdge::None: return @"none";
  }
  return @"none";
}

static NSString *RNFoldableEdgeName(RNFoldableLayoutSecondaryOverlayEdge edge)
{
  switch (edge) {
    case RNFoldableLayoutSecondaryOverlayEdge::Leading: return @"leading";
    case RNFoldableLayoutSecondaryOverlayEdge::Trailing: return @"trailing";
    case RNFoldableLayoutSecondaryOverlayEdge::None: return @"none";
  }
  return @"none";
}

@interface RNFoldableLayoutView () <RNFoldableLayoutHostDelegate>
@end

@implementation RNFoldableLayoutView {
  RNFoldableLayoutHost *_host;
  NSMutableArray<UIView *> *_panes;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNFoldableLayoutComponentDescriptor>();
}

// The host owns a UIHostingController; recycling would leak SwiftUI state
// between unrelated layouts.
+ (BOOL)shouldBeRecycled
{
  return NO;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = std::make_shared<const RNFoldableLayoutProps>();
    _panes = [NSMutableArray new];
    _host = [[RNFoldableLayoutHost alloc] initWithFrame:self.bounds];
    _host.delegate = self;
    self.contentView = _host;
  }
  return self;
}

#pragma mark - Children

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_panes insertObject:childComponentView atIndex:index];
  [self assignPanes];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
  [_panes removeObjectIdenticalTo:childComponentView];
  [self assignPanes];
}

// FoldableLayout always renders exactly two RNFoldablePane children, primary
// first. Anything else would silently misassign slots, so fail loudly in debug.
- (void)assignPanes
{
  RCTAssert(_panes.count <= 2, @"RNFoldableLayout expects at most 2 panes, got %lu", (unsigned long)_panes.count);
  for (UIView *pane in _panes) {
    RCTAssert([pane isKindOfClass:RNFoldablePaneView.class], @"RNFoldableLayout child is not a pane: %@", pane);
  }
  UIView *primary = _panes.count > 0 ? _panes[0] : nil;
  UIView *secondary = _panes.count > 1 ? _panes[1] : nil;
  [_host setPrimary:primary secondary:secondary];
}

#pragma mark - Props

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &next = *std::static_pointer_cast<const RNFoldableLayoutProps>(props);
  [_host applyWithMode:RNFoldableModeName(next.mode)
                  axis:RNFoldableAxisName(next.axis)
            trackHinge:next.trackHinge
    primaryOverlayEdge:RNFoldableEdgeName(next.primaryOverlayEdge)
  secondaryOverlayEdge:RNFoldableEdgeName(next.secondaryOverlayEdge)
            splitRatio:next.splitRatio];
  [super updateProps:props oldProps:oldProps];
}

#pragma mark - RNFoldableLayoutHostDelegate

- (void)layoutHost:(RNFoldableLayoutHost *)host
    didUpdateHingeAvailable:(BOOL)available
                      angle:(double)angle
                    posture:(NSString *)posture
{
  if (!_eventEmitter) {
    return;
  }
  auto emitter = std::static_pointer_cast<const RNFoldableLayoutEventEmitter>(_eventEmitter);
  emitter->onHingeUpdate({
      .available = static_cast<bool>(available),
      .angle = angle,
      .posture = std::string(posture.UTF8String),
  });
}

- (void)layoutHost:(RNFoldableLayoutHost *)host
    didUpdateArrangementWithSize:(CGSize)size
                  primaryVisible:(BOOL)primaryVisible
                    primaryFrame:(CGRect)primaryFrame
                secondaryVisible:(BOOL)secondaryVisible
                  secondaryFrame:(CGRect)secondaryFrame
{
  if (!_eventEmitter) {
    return;
  }
  auto emitter = std::static_pointer_cast<const RNFoldableLayoutEventEmitter>(_eventEmitter);
  emitter->onArrangementUpdate({
      .width = size.width,
      .height = size.height,
      .primary =
          {
              .visible = static_cast<bool>(primaryVisible),
              .x = primaryFrame.origin.x,
              .y = primaryFrame.origin.y,
              .width = primaryFrame.size.width,
              .height = primaryFrame.size.height,
          },
      .secondary =
          {
              .visible = static_cast<bool>(secondaryVisible),
              .x = secondaryFrame.origin.x,
              .y = secondaryFrame.origin.y,
              .width = secondaryFrame.size.width,
              .height = secondaryFrame.size.height,
          },
  });
}

- (void)layoutHost:(RNFoldableLayoutHost *)host didPlace:(UIView *)pane frame:(CGRect)frame
{
  if ([pane isKindOfClass:RNFoldablePaneView.class]) {
    [(RNFoldablePaneView *)pane applyNativeFrame:frame];
  }
}

@end
