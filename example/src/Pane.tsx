import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { type LayoutMode, useArrangement, useHinge } from 'react-native-adaptive-layout';
import { palette, space } from './theme';

export interface PaneProps {
  slot: 'primary' | 'secondary';
  mode: LayoutMode;
}

/** One slot of the layout: its name, the hinge angle and its native-assigned size. */
export function Pane({ slot, mode }: PaneProps) {
  const theme = palette[slot];
  const floating = slot === 'primary' && mode === 'overlay';
  const [size, setSize] = useState({ width: 0, height: 0 });
  const hinge = useHinge();
  const degrees = hinge.angleDegrees === null ? null : Math.round(hinge.angleDegrees);
  const arrangement = useArrangement();
  const visibleCount = [arrangement.primary, arrangement.secondary].filter((p) => p.visible).length;

  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) =>
    setSize({ width: Math.round(layout.width), height: Math.round(layout.height) });

  return (
    <View
      testID={`${slot}-pane`}
      onLayout={onLayout}
      pointerEvents={floating ? 'box-none' : 'auto'}
      style={[styles.pane, floating ? styles.floating : { backgroundColor: theme.fill }]}
    >
      <View style={[styles.card, floating && { backgroundColor: theme.fill }]}>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>{slot.toUpperCase()}</Text>
        <Text style={[styles.angle, { color: theme.text }]}>
          {degrees === null ? '––' : `${degrees}°`}
        </Text>
        <Text testID={`${slot}-size`} style={[styles.size, { color: theme.text }]}>
          {size.width} × {size.height}
        </Text>
        {/* Hidden: read by the headless release QA, not shown to keep the pane clean. */}
        <Text testID={`${slot}-arrangement`} style={styles.hidden}>
          {arrangement.kind} · {visibleCount} visible
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, padding: space.lg, justifyContent: 'center' },
  floating: { backgroundColor: 'transparent', justifyContent: 'flex-end' },
  card: { alignItems: 'center', gap: space.xs, padding: space.xl },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  angle: { fontSize: 48, fontWeight: '800', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  size: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'], opacity: 0.6 },
  hidden: { display: 'none' },
});
