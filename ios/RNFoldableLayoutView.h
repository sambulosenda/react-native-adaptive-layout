#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/// Fabric component view for `FoldableLayout`. Bridges props and child panes to
/// `RNFoldableLayoutHost` and forwards hinge updates as direct events.
@interface RNFoldableLayoutView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END
