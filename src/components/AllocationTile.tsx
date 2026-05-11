import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../ThemeContext';
import { palette, radius, space, CATEGORY_GRADIENT, v7Text, v7Surface } from '../theme';
import { fmt } from '../lib/format';
import { Icon } from './Icon';
import { Txt } from './Txt';
import type { MainCategoryId } from '../lib/budget';

interface Props {
  main: MainCategoryId;
  label: string;
  icon: string;
  budget: number;
  spent?: number;
  onPress?: () => void;
}

/**
 * v7 pastel-glass allocation tile.
 * - 2-stop pastel gradient base per category
 * - 22% white wash overlay (frosted glass feel)
 * - White IconChip (top-left), percentage badge (top-right)
 * - Label + spent + "of {budget}" stacked
 * - Press scales to 0.97 with quick easing
 */
export function AllocationTile({ main, label, icon, budget, spent = 0, onPress }: Props) {
  const isOver = spent > budget;
  const pct = budget > 0 ? Math.min(999, Math.round((spent / budget) * 100)) : 0;
  const [c1, c2] = CATEGORY_GRADIENT[main];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.wrap,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 22% white frosted overlay */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: v7Surface.blurWash }]} />
      {/* subtle top-left highlight */}
      <View style={styles.highlight} />

      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.iconChip}>
            <Icon name={icon} size={15} color={v7Text.primary} strokeWidth={2} />
          </View>
          <Txt variant="caption" color={v7Text.secondary} style={styles.pct}>
            {pct}%
          </Txt>
        </View>

        <Txt variant="bodySmMed" color={v7Text.secondary} style={styles.label}>
          {label}
        </Txt>

        <Txt
          variant="headingSm"
          color={isOver ? palette.errorRed : v7Text.primary}
          style={styles.amount}
        >
          {fmt(spent, { compact: true })}
        </Txt>

        <Txt variant="caption" color={v7Text.tertiary}>
          of {fmt(budget, { compact: true })}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: '47%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: v7Surface.hairline,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    // simulate radial highlight in the top-left corner — a single soft
    // white block fading via gradient would be perfect but we approximate
    // with a near-transparent overlay
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  inner: {
    padding: 14,
    alignItems: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: { fontWeight: '600' as const },
  label: {
    marginBottom: 1,
  },
  amount: {
    letterSpacing: -0.5,
    marginBottom: 1,
  },
});
