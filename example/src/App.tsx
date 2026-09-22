import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  FoldableLayout,
  type LayoutAxis,
  type LayoutMode,
  type OverlayEdge,
} from 'react-native-adaptive-layout';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from './Chip';
import { Pane } from './Pane';
import { palette, radius, space } from './theme';

const MODES: readonly LayoutMode[] = ['split', 'overlay'];
const AXES: readonly LayoutAxis[] = ['any', 'horizontal', 'vertical'];
// 'auto' leaves the edge unset so the system chooses.
const EDGES: readonly (OverlayEdge | 'auto')[] = ['auto', 'leading', 'trailing'];

export default function App() {
  const [mode, setMode] = useState<LayoutMode>('split');
  const [axis, setAxis] = useState<LayoutAxis>('any');
  const [edge, setEdge] = useState<OverlayEdge | 'auto'>('auto');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />

        <View style={styles.header}>
          <Text style={styles.title}>Foldable Playground</Text>
          <View style={styles.controls}>
            {MODES.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={option === mode}
                onPress={() => setMode(option)}
              />
            ))}
            <View style={styles.divider} />
            {AXES.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={option === axis}
                onPress={() => setAxis(option)}
              />
            ))}
            {mode === 'overlay' && (
              <>
                <View style={styles.divider} />
                {EDGES.map((option) => (
                  <Chip
                    key={option}
                    label={option}
                    selected={option === edge}
                    onPress={() => setEdge(option)}
                  />
                ))}
              </>
            )}
          </View>
        </View>

        <View style={styles.stage}>
          <FoldableLayout style={styles.layout} mode={mode} axis={axis}>
            <FoldableLayout.Primary overlayEdge={edge === 'auto' ? undefined : edge}>
              <Pane slot="primary" mode={mode} />
            </FoldableLayout.Primary>
            <FoldableLayout.Secondary>
              <Pane slot="secondary" mode={mode} />
            </FoldableLayout.Secondary>
          </FoldableLayout>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  header: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.lg,
    gap: space.md,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, color: palette.ink },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  divider: { width: 1, height: 20, backgroundColor: palette.line, marginHorizontal: space.xs },
  stage: {
    flex: 1,
    marginHorizontal: space.lg,
    marginBottom: space.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
  },
  layout: { flex: 1 },
});
