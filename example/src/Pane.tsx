import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { type LayoutMode, useHinge } from 'react-native-foldable';
import { colors, spacing } from './theme';

export interface PaneProps {
  slot: 'primary' | 'secondary';
  mode: LayoutMode;
}

/** Content for one slot. Shows the size native assigned it and the live hinge state. */
export function Pane({ slot, mode }: PaneProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const hinge = useHinge();
  const floating = slot === 'primary' && mode === 'overlay';

  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) =>
    setSize({ width: Math.round(layout.width), height: Math.round(layout.height) });

  return (
    <View
      testID={`${slot}-pane`}
      onLayout={onLayout}
      pointerEvents={floating ? 'box-none' : 'auto'}
      style={[styles.pane, styles[slot], floating && styles.floating]}
    >
      <View style={[styles.card, floating && styles.floatingCard]}>
        <Text style={styles.title}>{slot === 'primary' ? 'Primary' : 'Secondary'}</Text>
        <Text testID={`${slot}-size`} style={styles.meta}>
          {size.width} × {size.height} pt
        </Text>
        <View style={styles.hinge}>
          <Text testID={`${slot}-angle`} style={styles.angle}>
            {hinge.angleDegrees === null ? '—' : `${Math.round(hinge.angleDegrees)}°`}
          </Text>
          <Text testID={`${slot}-posture`} style={styles.posture}>
            {hinge.available ? hinge.posture : 'no hinge'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1 },
  primary: { backgroundColor: colors.primaryPane },
  secondary: { backgroundColor: colors.secondaryPane },
  floating: { backgroundColor: 'transparent', justifyContent: 'flex-end', padding: spacing.lg },
  card: { padding: spacing.xl, gap: spacing.sm },
  floatingCard: { backgroundColor: `${colors.primaryPane}ee`, borderRadius: 22 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  meta: { color: colors.textMuted, fontSize: 12, fontVariant: ['tabular-nums'] },
  hinge: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  angle: { color: colors.text, fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'] },
  posture: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
