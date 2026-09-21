import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FoldableLayout, type LayoutAxis, type LayoutMode } from 'react-native-foldable';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Pane } from './Pane';
import { Segmented } from './Segmented';
import { colors, spacing } from './theme';

const MODES: readonly LayoutMode[] = ['split', 'overlay'];
const AXES: readonly LayoutAxis[] = ['any', 'horizontal', 'vertical'];

export default function App() {
  const [mode, setMode] = useState<LayoutMode>('split');
  const [axis, setAxis] = useState<LayoutAxis>('any');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.brand}>react-native-foldable</Text>
          <View style={styles.controls}>
            <Segmented label="Mode" options={MODES} value={mode} onChange={setMode} />
            <View style={styles.divider} />
            <Segmented label="Axis" options={AXES} value={axis} onChange={setAxis} />
          </View>
        </View>

        <FoldableLayout style={styles.layout} mode={mode} axis={axis}>
          <FoldableLayout.Primary>
            <Pane slot="primary" mode={mode} />
          </FoldableLayout.Primary>
          <FoldableLayout.Secondary>
            <Pane slot="secondary" mode={mode} />
          </FoldableLayout.Secondary>
        </FoldableLayout>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  brand: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  divider: { width: 1, height: 20, backgroundColor: colors.hairline },
  layout: { flex: 1, overflow: 'hidden' },
});
