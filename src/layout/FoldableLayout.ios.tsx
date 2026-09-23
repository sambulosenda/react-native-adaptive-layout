import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ArrangementStoreContext } from '../arrangement/context';
import { toArrangement } from '../arrangement/state';
import { createArrangementStore } from '../arrangement/store';
import { HingeStoreContext } from '../hinge/context';
import { toHingeState, UNAVAILABLE_HINGE } from '../hinge/state';
import { createHingeStore } from '../hinge/store';
import NativeFoldableLayout, { type NativeProps } from '../native/FoldableLayoutNativeComponent';
import NativeFoldablePane from '../native/FoldablePaneNativeComponent';
import type { FoldableLayoutProps } from '../types';
import { warnOnce } from '../warn';
import { Primary, resolveOverlayEdges, resolveSlots, Secondary } from './slots';

type HingeUpdate = NonNullable<NativeProps['onHingeUpdate']>;
type ArrangementUpdate = NonNullable<NativeProps['onArrangementUpdate']>;

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
  const [arrangementStore] = useState(() => createArrangementStore());

  const onHingeUpdate = useCallback<HingeUpdate>(
    (event) => store.publish(toHingeState(event.nativeEvent)),
    [store],
  );

  const onArrangementUpdate = useCallback<ArrangementUpdate>(
    (event) => arrangementStore.publish(toArrangement(event.nativeEvent)),
    [arrangementStore],
  );

  useEffect(() => {
    if (!trackHinge) store.publish(UNAVAILABLE_HINGE);
  }, [trackHinge, store]);

  const { primary, secondary, issues } = resolveSlots(children);
  const edges = resolveOverlayEdges(primary?.props.overlayEdge, secondary?.props.overlayEdge);
  warnOnce([...issues, ...edges.issues]);

  // Native assigns panes by mount index: primary first, secondary second.
  return (
    <HingeStoreContext value={store}>
      <ArrangementStoreContext value={arrangementStore}>
        <NativeFoldableLayout
          {...viewProps}
          mode={mode}
          axis={axis}
          trackHinge={trackHinge}
          primaryOverlayEdge={edges.primary}
          secondaryOverlayEdge={edges.secondary}
          onHingeUpdate={onHingeUpdate}
          onArrangementUpdate={onArrangementUpdate}
        >
          <NativeFoldablePane collapsable={false} pointerEvents="box-none" style={styles.pane}>
            {primary}
          </NativeFoldablePane>
          <NativeFoldablePane collapsable={false} pointerEvents="box-none" style={styles.pane}>
            {secondary}
          </NativeFoldablePane>
        </NativeFoldableLayout>
      </ArrangementStoreContext>
    </HingeStoreContext>
  );
}
FoldableLayout.Primary = Primary;
FoldableLayout.Secondary = Secondary;

const styles = StyleSheet.create({
  pane: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
