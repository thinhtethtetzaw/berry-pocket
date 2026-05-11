import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { CATEGORY_SOLID, v7Text, v7TileInk, v7Accent } from '../theme';
import { fmt } from '../lib/format';
import { Txt } from './Txt';
import type { MainCategoryId } from '../lib/budget';

interface Props {
  main: MainCategoryId;
  label: string;
  /** Lucide icon name — kept for API compatibility; v13 design doesn't render an icon on the tile. */
  icon?: string;
  budget: number;
  spent?: number;
  onPress?: () => void;
  /**
   * v13 checker pattern: pass true for tiles that should have the saturated
   * pastel background (typically positions 0 & 3 in a 2×2 grid).
   * Pass false (or omit) for plain light-gray tiles.
   */
  solid?: boolean;
}

/**
 * v13 bento allocation tile.
 *   ┌────────────────────────┐
 *   │ Label              99% │
 *   │                        │
 *   │ ฿34k                   │
 *   │ ▾ of ฿34k              │
 *   └────────────────────────┘
 * Two variants:
 *   - solid=true:  colored bento background, dark ink text
 *   - solid=false: plain light-gray background, hairline border
 */
export function AllocationTile({ main, label, budget, spent = 0, onPress, solid }: Props) {
  const { theme } = useTheme();
  const isOver = spent > budget;
  const pct = budget > 0 ? Math.min(999, Math.round((spent / budget) * 100)) : 0;
  const color = CATEGORY_SOLID[main];

  // Text colors depend on which variant we're rendering.
  const labelColor = solid ? v7TileInk.secondary : v7Text.secondary;
  const pctColor   = solid ? v7TileInk.secondary : v7Text.tertiary;
  const amountColor = isOver
    ? v7Accent.danger
    : solid ? v7TileInk.primary : v7Text.primary;
  const subColor = solid ? v7TileInk.secondary : v7Text.tertiary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.wrap,
        solid
          ? { backgroundColor: color }
          : { backgroundColor: '#F7F8FB', borderWidth: 1, borderColor: '#E6E8EF' },
        { transform: [{ scale: pressed && onPress ? 0.97 : 1 }] },
      ]}
    >
      {/* Top row — label + percentage */}
      <View style={styles.topRow}>
        <Txt variant="bodySmMed" color={labelColor} style={styles.label}>
          {label}
        </Txt>
        <Txt variant="caption" color={pctColor} style={styles.pct}>
          {pct}%
        </Txt>
      </View>

      {/* Bottom — amount + "of {total}" */}
      <View>
        <Txt variant="headingMd" color={amountColor} style={styles.amount}>
          {fmt(spent, { compact: true })}
        </Txt>
        <View style={styles.subRow}>
          <View style={[styles.triangle, { borderTopColor: subColor }]} />
          <Txt variant="caption" color={subColor}>
            of {fmt(budget, { compact: true })}
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: '47%',
    height: 128,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { letterSpacing: 0.2 },
  pct: { fontWeight: '700' as const, fontSize: 10 },
  amount: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.7,
    lineHeight: 28,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
