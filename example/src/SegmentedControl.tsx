import { useEffect, useRef, useState } from 'react';
import { Animated, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette, radius, space } from './theme';

export interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}

/** iOS-style segmented control with a sliding thumb. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.indexOf(value));
  const thumb = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(thumb, { toValue: index, useNativeDriver: true, bounciness: 4 }).start();
  }, [index, thumb]);

  const segment = width / options.length;
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.track} onLayout={onLayout} accessibilityRole="tablist">
      {segment > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: segment - space.xs,
              transform: [{ translateX: Animated.multiply(thumb, segment) }],
            },
          ]}
        />
      )}
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={styles.segment}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: '#2A2A31',
    borderRadius: radius.md,
    padding: space.xs / 2,
  },
  thumb: {
    position: 'absolute',
    top: space.xs / 2,
    bottom: space.xs / 2,
    left: space.xs / 2,
    marginLeft: space.xs / 2,
    borderRadius: radius.md - 2,
    backgroundColor: palette.accent,
  },
  segment: { flex: 1, paddingVertical: space.sm, alignItems: 'center' },
  label: { color: palette.barMuted, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  labelSelected: { color: palette.barText },
});
