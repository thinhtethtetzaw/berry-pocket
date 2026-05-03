import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Eye, EyeOff, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { radius, space } from '../theme';
import { fmt } from '../lib/format';
import { Txt } from './Txt';

interface Props {
  income: number;
  spent: number;
  onAddExpense?: () => void;
  onAddIncome?: () => void;
}

export function HeroBalance({ income, spent, onAddExpense, onAddIncome }: Props) {
  const { theme } = useTheme();
  const [hidden, setHidden] = useState(false);
  const remaining = income - spent;

  return (
    <View style={styles.wrap}>
      <Txt variant="microBold" color={theme.steel} style={styles.eyebrow}>
        WALLET BALANCE
      </Txt>

      <View style={styles.amountRow}>
        <Txt variant="heroDisplay" color={theme.ink} style={styles.amount}>
          {hidden ? '฿••••••' : fmt(remaining)}
        </Txt>
        <Pressable onPress={() => setHidden(h => !h)} hitSlop={12} style={styles.eyeBtn}>
          {hidden
            ? <EyeOff size={20} color={theme.muted} strokeWidth={2} />
            : <Eye size={20} color={theme.muted} strokeWidth={2} />}
        </Pressable>
      </View>

      {(onAddExpense || onAddIncome) && (
        <View style={styles.pills}>
          <Pressable
            onPress={onAddExpense}
            style={({ pressed }) => [styles.pill, { backgroundColor: theme.ink, opacity: pressed ? 0.85 : 1 }]}
          >
            <Minus size={16} color="#FFFFFF" strokeWidth={2.4} />
            <Txt variant="buttonMd" color="#FFFFFF">New Expense</Txt>
          </Pressable>

          <Pressable
            onPress={onAddIncome}
            style={({ pressed }) => [
              styles.pill,
              styles.pillOutline,
              { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Plus size={16} color={theme.ink} strokeWidth={2.4} />
            <Txt variant="buttonMd" color={theme.ink}>Income</Txt>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: space.lg,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: space.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginBottom: space.lg,
  },
  amount: {
    textAlign: 'center',
  },
  eyeBtn: {
    padding: 4,
  },
  pills: {
    flexDirection: 'row',
    gap: space.sm,
    width: '100%',
    paddingHorizontal: space.md,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radius.full,
  },
  pillOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});
