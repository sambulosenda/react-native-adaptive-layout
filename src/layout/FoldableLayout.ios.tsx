import { type ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { HingeStoreContext } from '../hinge/context';
import { toHingeState, UNAVAILABLE_HINGE } from '../hinge/state';
import { createHingeStore } from '../hinge/store';
import NativeFoldableLayout, { type NativeProps } from '../native/FoldableLayoutNativeComponent';
import NativeFoldablePane from '../native/FoldablePaneNativeComponent';
import type { FoldableLayoutProps, SlotProps } from '../types';
import { warnOnce } from '../warn';
import { Primary, resolveSlots, Secondary } from './slots';

type HingeUpdate = NonNullable<NativeProps['onHingeUpdate']>;

/**
 * iOS implementation backed by SwiftUI's adaptive arrangement APIs. The
 * native side owns pane geometry; React owns pane content.
 */
export function FoldableLayout({
  children,
  mode = 'split',
  axis = 'any',
  trackHinge = true,
  ...viewProps
}: FoldableLayoutProps) {
  const [store] = useState(createHingeStore);

  const onHingeUpdate = useCallback<HingeUpdate>(
    (event) => store.publish(toHingeState(event.nativeEvent)),
    [store],
  );

  useEffect(() => {
    if (!trackHinge) store.publish(UNAVAILABLE_HINGE);
  }, [trackHinge, store]);

  const { primary, secondary, issues } = resolveSlots(children);
  warnOnce(issues);

  // Native assigns panes by mount index: primary first, secondary second.
  return (
    <HingeStoreContext value={store}>
      <NativeFoldableLayout
        {...viewProps}
        mode={mode}
        axis={axis}
        trackHinge={trackHinge}
        primaryOverlayEdge={overlayEdgeOf(primary)}
        secondaryOverlayEdge={overlayEdgeOf(secondary)}
        onHingeUpdate={onHingeUpdate}
      >
        <NativeFoldablePane collapsable={false} pointerEvents="box-none" style={styles.pane}>
          {primary}
        </NativeFoldablePane>
        <NativeFoldablePane collapsable={false} pointerEvents="box-none" style={styles.pane}>
          {secondary}
        </NativeFoldablePane>
      </NativeFoldableLayout>
    </HingeStoreContext>
  );
}
FoldableLayout.Primary = Primary;
FoldableLayout.Secondary = Secondary;

function overlayEdgeOf(slot: ReactElement<SlotProps> | null) {
  return slot?.props.overlayEdge ?? 'none';
}

const styles = StyleSheet.create({
  pane: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
