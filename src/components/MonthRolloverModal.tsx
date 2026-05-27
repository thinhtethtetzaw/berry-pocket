import { useEffect, useMemo, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { palette, radius, space, v7Accent } from '../theme';
import { fmt, MONTHS_SHORT } from '../lib/format';
import { Txt } from './Txt';
import { SpendingDonut } from './SpendingDonut';
import type { Transaction } from '../lib/budget';
import { useAllMainCategories } from '../lib/storage';
import { buildMainSegments } from '../lib/categoryStats';

interface Props {
  visible: boolean;
  prevYear: number;
  prevMonth: number;
  onContinue: () => void;
}

interface Snapshot {
  income:    number;
  savings:   number;
  necessary: number;
  living:    number;
  rosca:     number;
  fixed:     number;
  txCount:   number;
}

export function MonthRolloverModal({ visible, prevYear, prevMonth, onContinue }: Props) {
  const { theme } = useTheme();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const mainCategories = useAllMainCategories();

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const key = `bb:month:${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
      try {
        const raw = await AsyncStorage.getItem(key);
        const parsed: Transaction[] = raw ? JSON.parse(raw) : [];
        const t: Snapshot = { income: 0, savings: 0, necessary: 0, living: 0, rosca: 0, fixed: 0, txCount: parsed.length };
        for (const tx of parsed) {
          if (t[tx.main as keyof Snapshot] !== undefined && tx.main !== 'income') {
            t[tx.main as keyof Snapshot] = (t[tx.main as keyof Snapshot] as number) + tx.amount;
          } else if (tx.main === 'income') {
            t.income += tx.amount;
          }
        }
        if (alive) { setSnap(t); setTxs(parsed); setLoading(false); }
      } catch {
        if (alive) { setSnap(null); setTxs([]); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, [visible, prevYear, prevMonth]);

  const donutSegments = useMemo(
    () => buildMainSegments(txs, mainCategories, 'out'),
    [txs, mainCategories],
  );

  const totalSpent = useMemo(() => {
    if (!snap) return 0;
    return snap.savings + snap.necessary + snap.living + snap.rosca + snap.fixed;
  }, [snap]);

  const net = (snap?.income ?? 0) - totalSpent;

  const top = useMemo(() => {
    if (!snap) return [] as { id: string; label: string; amount: number }[];
    const entries = [
      { id: 'savings',   label: 'Savings',   amount: snap.savings },
      { id: 'necessary', label: 'Necessary', amount: snap.necessary },
      { id: 'living',    label: 'Living',    amount: snap.living },
      { id: 'rosca',     label: 'ROSCA',     amount: snap.rosca },
      { id: 'fixed',     label: 'Fixed',     amount: snap.fixed },
    ].filter(e => e.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 3);
    return entries;
  }, [snap]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={S.backdrop}>
        <View style={[S.sheet, { borderColor: theme.border }]}>
          {/* Header */}
          <View style={S.iconCircle}>
            <Sparkles size={20} color={palette.successText} strokeWidth={2.2} />
          </View>
          <Txt variant="headingMd" color={theme.ink} style={{ textAlign: 'center', marginTop: space.sm }}>
            New month, fresh start
          </Txt>
          <Txt variant="caption" color={theme.muted} style={{ textAlign: 'center', marginTop: 4 }}>
            Here's how {MONTHS_SHORT[prevMonth]} {prevYear} went
          </Txt>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }} contentContainerStyle={{ paddingTop: space.lg }}>
            {loading ? (
              <Txt variant="bodySmMed" color={theme.muted} style={{ textAlign: 'center', paddingVertical: space.xl }}>
                Loading…
              </Txt>
            ) : !snap || snap.txCount === 0 ? (
              <View style={[S.emptyCard, { backgroundColor: theme.bgSubtle }]}>
                <Txt variant="bodySmMed" color={theme.steel} style={{ textAlign: 'center' }}>
                  No transactions recorded last month.
                </Txt>
              </View>
            ) : (
              <>
                {/* Net summary */}
                <View style={[S.netCard, { backgroundColor: net >= 0 ? '#DEF1E6' : '#FCE5DC' }]}>
                  <Txt variant="microBold" color={net >= 0 ? palette.successText : v7Accent.danger} style={S.eyebrow}>
                    {net >= 0 ? 'NET POSITIVE' : 'NET NEGATIVE'}
                  </Txt>
                  <Txt variant="headingMd" color={net >= 0 ? palette.successText : v7Accent.danger}>
                    {net >= 0 ? '+' : '−'}{fmt(Math.abs(net), { compact: true })}
                  </Txt>
                </View>

                {/* Income / Expense pair */}
                <View style={S.summaryRow}>
                  <View style={[S.sumCard, { backgroundColor: '#DEF1E6B3' }]}>
                    <Txt variant="microBold" color={palette.successText} style={S.eyebrow}>INCOME</Txt>
                    <Txt variant="bodyMdBold" color={palette.successText}>
                      +{fmt(snap.income, { compact: true })}
                    </Txt>
                  </View>
                  <View style={[S.sumCard, { backgroundColor: '#FCE5DCB3' }]}>
                    <Txt variant="microBold" color={v7Accent.danger} style={S.eyebrow}>EXPENSE</Txt>
                    <Txt variant="bodyMdBold" color={v7Accent.danger}>
                      −{fmt(totalSpent, { compact: true })}
                    </Txt>
                  </View>
                </View>

                <View style={{ height: space.md }} />
                <SpendingDonut
                  income={snap.income}
                  segments={donutSegments}
                  size={140}
                />

                {top.length > 0 && (
                  <View style={{ marginTop: space.md }}>
                    <Txt variant="microBold" color={theme.steel} style={[S.eyebrow, { marginBottom: space.sm }]}>
                      TOP SPENDING
                    </Txt>
                    {top.map((row, i) => (
                      <View key={row.id} style={[S.topRow, i < top.length - 1 && { borderBottomColor: theme.borderSoft, borderBottomWidth: 1 }]}>
                        <Txt variant="bodySmMed" color={theme.ink}>{row.label}</Txt>
                        <Txt variant="bodyMdBold" color={theme.ink}>{fmt(row.amount, { compact: true })}</Txt>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [
              S.continueBtn,
              { backgroundColor: theme.ink, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Txt variant="buttonMd" color="#FFFFFF">Continue to this month</Txt>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxxl,
    padding: space.lg,
    borderWidth: 1,
  },
  iconCircle: {
    alignSelf: 'center',
    width: 44, height: 44,
    borderRadius: radius.full,
    backgroundColor: '#DEF1E6',
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1.2 },
  emptyCard: {
    borderRadius: radius.xl,
    padding: space.xl,
    marginBottom: space.lg,
  },
  netCard: {
    borderRadius: radius.xl,
    padding: space.md,
    alignItems: 'center',
    marginBottom: space.sm,
  },
  summaryRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.sm },
  sumCard: {
    flex: 1,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: radius.full,
    marginTop: space.lg,
  },
});
