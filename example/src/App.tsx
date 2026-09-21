import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FoldableLayout, type LayoutAxis, type LayoutMode } from 'react-native-foldable';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Pane } from './Pane';
import { SegmentedControl } from './SegmentedControl';
import { palette, radius, space } from './theme';

const MODES: readonly LayoutMode[] = ['split', 'overlay'];
const AXES: readonly LayoutAxis[] = ['any', 'horizontal', 'vertical'];

export default function App() {
  const [mode, setMode] = useState<LayoutMode>('split');
  const [axis, setAxis] = useState<LayoutAxis>('any');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        <View style={styles.titleBar}>
          <Text style={styles.title}>Foldable Playground</Text>
          <Text style={styles.subtitle}>
            {mode} · {axis} axis
          </Text>
        </View>

        <View style={styles.stage}>
          <FoldableLayout style={styles.layout} mode={mode} axis={axis}>
            <FoldableLayout.Primary>
              <Pane slot="primary" mode={mode} />
            </FoldableLayout.Primary>
            <FoldableLayout.Secondary>
              <Pane slot="secondary" mode={mode} />
            </FoldableLayout.Secondary>
          </FoldableLayout>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Mode</Text>
            <SegmentedControl options={MODES} value={mode} onChange={setMode} />
          </View>
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Axis</Text>
            <SegmentedControl options={AXES} value={axis} onChange={setAxis} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  titleBar: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.lg, gap: 2 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, color: palette.ink },
  subtitle: { fontSize: 13, color: palette.inkMuted, textTransform: 'capitalize' },
  stage: {
    flex: 1,
    marginHorizontal: space.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
  },
  layout: { flex: 1 },
  toolbar: {
    backgroundColor: palette.bar,
    marginTop: space.lg,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: space.md,
  },
  control: { gap: space.sm },
  controlLabel: { color: palette.barMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
});
