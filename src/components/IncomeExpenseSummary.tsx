import { View, StyleSheet } from 'react-native';
import { v7Text, v7Surface, v7Accent } from '../theme';
import { Txt } from './Txt';
import { AnimatedNumber } from './AnimatedNumber';
import { getFmtCurrency } from '../lib/format';

interface Props {
  income: number;
  expense: number;
}

/**
 * The "INCOME / EXPENSE" two-card row used at the top of Activity and
 * inside Statistics. Plain gray cards with colored animated numbers —
 * the currency symbol sits at 0.65 opacity / medium weight, then the
 * tabular number counts up to the target value.
 */
export function IncomeExpenseSummary({ income, expense }: Props) {
  const currency = getFmtCurrency();
  return (
    <View style={styles.row}>
      <SumCard label="INCOME" sign="+" color={v7Accent.success} value={income} currency={currency} />
      <SumCard label="EXPENSE" sign="−" color={v7Accent.danger}  value={expense} currency={currency} />
    </View>
  );
}

function SumCard({
  label, sign, color, value, currency,
}: { label: string; sign: string; color: string; value: number; currency: string }) {
  return (
    <View style={styles.card}>
      <Txt variant="microBold" color={v7Text.secondary} style={styles.eyebrow}>
        {label}
      </Txt>
      <View style={styles.amountRow}>
        <Txt variant="headingSm" color={color} style={styles.sign}>{sign}</Txt>
        <Txt variant="headingSm" color={color} style={styles.symbol}>{currency}</Txt>
        <AnimatedNumber
          value={value}
          variant="headingSm"
          color={color}
          style={styles.number}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: v7Surface.plainCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  sign: {
    letterSpacing: -0.5,
  },
  symbol: {
    opacity: 0.65,
    fontWeight: '500' as const,
    letterSpacing: -0.5,
  },
  number: {
    letterSpacing: -0.5,
  },
});
