import { useCallback, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { type HingeState, type LayoutMode, useHinge } from 'react-native-foldable';
import { HingeGauge } from './HingeGauge';
import { palette, radius, space } from './theme';

export interface PaneProps {
  slot: 'primary' | 'secondary';
  mode: LayoutMode;
}

interface LogEntry {
  id: number;
  at: string;
  text: string;
}

const MAX_LOG = 3;

function describe(hinge: HingeState): string {
  if (!hinge.available) return 'hinge unavailable';
  const degrees = hinge.angleDegrees === null ? '?' : Math.round(hinge.angleDegrees);
  return `${hinge.posture} · ${degrees}°`;
}

/** One slot of the layout: native-assigned size, hinge gauge and a live event log. */
export function Pane({ slot, mode }: PaneProps) {
  const theme = palette[slot];
  const floating = slot === 'primary' && mode === 'overlay';
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [log, setLog] = useState<LogEntry[]>([]);

  const onHinge = useCallback((hinge: HingeState) => {
    setLog((previous) =>
      [
        {
          id: Date.now() + Math.random(),
          at: new Date().toLocaleTimeString(),
          text: describe(hinge),
        },
        ...previous,
      ].slice(0, MAX_LOG),
    );
  }, []);
  const hinge = useHinge(onHinge);

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
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>{slot.toUpperCase()} PANE</Text>
          <Text testID={`${slot}-size`} style={[styles.size, { color: theme.text }]}>
            {size.width} × {size.height}
          </Text>
        </View>

        <HingeGauge hinge={hinge} accent={theme.accent} text={theme.text} />

        <View style={styles.log}>
          {log.length === 0 ? (
            <Text style={styles.logEmpty}>Waiting for hinge events…</Text>
          ) : (
            log.map((entry) => (
              <View key={entry.id} style={styles.logRow}>
                <Text style={styles.logTime}>{entry.at}</Text>
                <Text style={[styles.logText, { color: theme.text }]}>{entry.text}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1, padding: space.lg },
  floating: { backgroundColor: 'transparent', justifyContent: 'flex-end' },
  card: {
    gap: space.lg,
    borderRadius: radius.lg,
    padding: space.xl,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  size: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'], opacity: 0.7 },
  log: {
    gap: space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.12)',
    paddingTop: space.md,
  },
  logEmpty: { fontSize: 12, color: palette.inkMuted, fontStyle: 'italic' },
  logRow: { flexDirection: 'row', gap: space.md },
  logTime: { fontSize: 11, color: palette.inkMuted, fontVariant: ['tabular-nums'], width: 72 },
  logText: { fontSize: 12, fontWeight: '600' },
});
