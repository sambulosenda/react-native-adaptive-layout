#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/// A pane whose frame is dictated by SwiftUI. The assigned frame is pushed into
/// the shadow tree so Yoga lays out descendants against the real size.
@interface RNFoldablePaneView : RCTViewComponentView

/// Called by the layout host whenever SwiftUI (re)positions this pane.
/// `frame` is expressed in the enclosing `RNFoldableLayoutView`'s coordinates.
- (void)applyNativeFrame:(CGRect)frame;

@end

NS_ASSUME_NONNULL_END
