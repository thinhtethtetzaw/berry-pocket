import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../ThemeContext';
import { palette, radius, space, CATEGORY_BRAND } from '../theme';
import { fmt } from '../lib/format';
import { Icon } from './Icon';
import { Txt } from './Txt';
import type { MainCategoryId } from '../lib/budget';

const TILE_GRADIENT: Record<MainCategoryId, readonly [string, string]> = {
  income:    ['#CCFCE7', '#A3F0CC'],
  savings:   ['#DFE7FF', '#C4CFFF'],
  necessary: ['#EDE6FF', '#D8CCFF'],
  fixed:     ['#ECEFF4', '#D9DEE8'],
  rosca:     ['#D8EEFF', '#B6D9FF'],
  living:    ['#FFE4D6', '#FFCDB0'],
};

interface Props {
  main: MainCategoryId;
  label: string;
  icon: string;
  budget: number;
  spent?: number;
  onPress?: () => void;
}

export function AllocationTile({ main, label, icon, budget, spent = 0, onPress }: Props) {
  const { theme } = useTheme();
  const brand = CATEGORY_BRAND[main];
  const isOver = spent > budget;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.wrap,
        { borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <LinearGradient
        colors={TILE_GRADIENT[main]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.inner}>
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Icon name={icon} size={17} color={brand.bg} strokeWidth={2.2} />
        </View>

        {/* Label */}
        <Txt variant="bodySmMed" color={theme.ink} style={styles.label}>
          {label}
        </Txt>

        {/* Spent amount — hero */}
        <Txt variant="headingMd" color={isOver ? palette.errorRed : theme.ink} style={styles.amount}>
          {fmt(spent, { compact: true })}
        </Txt>

        {/* Budget — secondary */}
        <Txt variant="bodySmMed" color={theme.steel}>
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
    borderRadius: radius.xxxl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inner: {
    padding: 14,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    marginBottom: 2,
  },
  amount: {
    marginBottom: 2,
  },
});
