import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ArrangementStoreContext } from '../arrangement/context';
import { FALLBACK_ARRANGEMENT } from '../arrangement/state';
import { createArrangementStore } from '../arrangement/store';
import { HingeStoreContext } from '../hinge/context';
import { createHingeStore } from '../hinge/store';
import type { FoldableLayoutProps } from '../types';
import { warnOnce } from '../warn';
import { Primary, resolveSlots, Secondary } from './slots';

/**
 * Fallback for platforms without a native implementation (Android, web).
 *
 * Renders the primary pane full-size and keeps the secondary pane mounted but
 * hidden, so app state survives and `useHinge` resolves to "unavailable"
 * instead of throwing. Android support is tracked in docs/roadmap.md.
 */
export function FoldableLayout({
  children,
  mode: _mode,
  axis: _axis,
  trackHinge: _trackHinge,
  splitRatio: _splitRatio,
  style,
  ...viewProps
}: FoldableLayoutProps) {
  const [store] = useState(createHingeStore);
  const [arrangementStore] = useState(() => createArrangementStore(FALLBACK_ARRANGEMENT));
  const { primary, secondary, issues } = resolveSlots(children);
  warnOnce(issues);

  return (
    <HingeStoreContext value={store}>
      <ArrangementStoreContext value={arrangementStore}>
        <View {...viewProps} style={[styles.container, style]}>
          <View style={styles.pane}>{primary}</View>
          <View style={styles.hidden} pointerEvents="none" accessibilityElementsHidden>
            {secondary}
          </View>
        </View>
      </ArrangementStoreContext>
    </HingeStoreContext>
  );
}
FoldableLayout.Primary = Primary;
FoldableLayout.Secondary = Secondary;

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  pane: { flex: 1 },
  hidden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
});
