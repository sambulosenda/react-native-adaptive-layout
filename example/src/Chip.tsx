import { Pressable, StyleSheet, Text } from 'react-native';
import { palette, space } from './theme';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** A selectable pill for the mode and axis controls. */
export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: palette.line,
  },
  chipSelected: { backgroundColor: palette.ink, borderColor: palette.ink },
  label: { color: palette.inkMuted, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  labelSelected: { color: palette.canvas },
});
