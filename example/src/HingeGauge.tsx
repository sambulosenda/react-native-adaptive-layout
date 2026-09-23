import { StyleSheet, Text, View } from 'react-native';
import type { HingeState } from 'react-native-adaptive-layout';
import { palette, radius, space } from './theme';

export interface HingeGaugeProps {
  hinge: HingeState;
  accent: string;
  text: string;
}

const POSTURE_LABEL: Record<HingeState['posture'], string> = {
  unknown: 'Unknown',
  closed: 'Closed',
  partiallyOpen: 'Partially open',
  fullyOpen: 'Fully open',
};

/** A 0–180° bar with the current angle and OS-reported posture. */
export function HingeGauge({ hinge, accent, text }: HingeGaugeProps) {
  const degrees = hinge.angleDegrees === null ? null : Math.round(hinge.angleDegrees);
  const ratio = degrees === null ? 0 : Math.min(Math.max(degrees / 180, 0), 1);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.angle, { color: text }]}>
          {degrees === null ? '––' : `${degrees}°`}
        </Text>
        <View style={[styles.badge, { borderColor: accent }]}>
          <View
            style={[styles.dot, { backgroundColor: hinge.available ? accent : palette.inkMuted }]}
          />
          <Text style={[styles.badgeText, { color: text }]}>
            {hinge.available ? POSTURE_LABEL[hinge.posture] : 'No hinge'}
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.ticks}>
        {['0°', '90°', '180°'].map((tick) => (
          <Text key={tick} style={styles.tick}>
            {tick}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.sm },
  // Wraps so the badge drops below the angle in narrow panes instead of overflowing.
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: space.md,
    rowGap: space.sm,
  },
  angle: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  track: {
    height: 6,
    borderRadius: radius.sm,
    backgroundColor: palette.hairline,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.sm },
  ticks: { flexDirection: 'row', justifyContent: 'space-between' },
  tick: { fontSize: 10, color: palette.inkMuted, fontVariant: ['tabular-nums'] },
});
