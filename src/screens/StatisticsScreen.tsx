import { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Pencil, ArrowUp, Trash2, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { palette, radius, space, CATEGORY_GRADIENT, CHART_PALETTE, v7Text, v7Surface, v7Accent } from '../theme';
import { DailySpendBars } from '../components/DailySpendBars';
import { TransactionRow } from '../components/TransactionRow';
import { IncomeExpenseSummary } from '../components/IncomeExpenseSummary';
import { DatePickerField } from '../components/DatePickerField';
import { useTotal, useNecessaryFund, useNecessaryWithdrawals, useAllTransactions } from '../lib/storage';
import { AppHeader } from '../components/AppHeader';
import { PageBackground } from '../components/PageBackground';
import { SectionLabel } from '../components/SectionLabel';
import { SpendingDonut } from '../components/SpendingDonut';
import { DateFilterPills, RangePreset } from '../components/DateFilterPills';
import { EditAmountSheet } from '../components/EditAmountSheet';
import { UseNecessaryFundSheet } from '../components/UseNecessaryFundSheet';
import { Txt } from '../components/Txt';
import { fmt, MONTHS_SHORT } from '../lib/format';
import type { Transaction } from '../lib/budget';

type DatedTx = Transaction & { year: number; month: number };

interface Range { startY: number; startM: number; endY: number; endM: number; }

function getRange(preset: RangePreset, custom: Range): Range {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (preset === 'thisMonth') return { startY: y, startM: m, endY: y, endM: m };
  if (preset === 'lastMonth') {
    const lm = m === 0 ? 11 : m - 1;
    const ly = m === 0 ? y - 1 : y;
    return { startY: ly, startM: lm, endY: ly, endM: lm };
  }
  if (preset === 'thisYear') return { startY: y, startM: 0, endY: y, endM: 11 };
  if (preset === 'allTime')  return { startY: 1970, startM: 0, endY: 9999, endM: 11 };
  return custom;
}

function formatTopTxDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const stripped = new Date(d); stripped.setHours(0, 0, 0, 0);
  if (stripped.getTime() === today.getTime()) return 'TODAY';
  if (stripped.getTime() === yesterday.getTime()) return 'YESTERDAY';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
}

function inRange(tx: DatedTx, r: Range): boolean {
  const txKey = tx.year * 12 + tx.month;
  return txKey >= r.startY * 12 + r.startM && txKey <= r.endY * 12 + r.endM;
}

export function StatisticsScreen() {
  const { theme } = useTheme();
  const today = new Date();
  const { total, setManual: setTotal } = useTotal();
  const { fund, setManual: setFund } = useNecessaryFund();
  const { withdrawals, add: addWithdrawal, remove: removeWithdrawal } = useNecessaryWithdrawals();
  const { transactions } = useAllTransactions();

  const [preset, setPreset] = useState<RangePreset>('thisMonth');
  const [custom, setCustom] = useState<Range>({
    startY: today.getFullYear(), startM: 0,
    endY: today.getFullYear(),   endM: today.getMonth(),
  });

  const [editTotalOpen, setEditTotalOpen] = useState(false);
  const [editFundOpen, setEditFundOpen]   = useState(false);
  const [useFundOpen, setUseFundOpen]     = useState(false);

  const range = useMemo(() => getRange(preset, custom), [preset, custom]);

  const filtered = useMemo(
    () => transactions.filter(t => inRange(t, range)),
    [transactions, range],
  );

  const totals = useMemo(() => {
    const t = { income: 0, savings: 0, necessary: 0, fixed: 0, rosca: 0, living: 0 };
    for (const tx of filtered) t[tx.main] += tx.amount;
    return t;
  }, [filtered]);

  // All outflows (used for donut breakdown and "total spending" headline that
  // shows the full breakdown including transfers to Total/Fund).
  const totalSpent = totals.savings + totals.necessary + totals.living + totals.rosca + totals.fixed;
  // True expense — savings + necessary are transfers, not expenses.
  const trueExpense = totals.living + totals.rosca + totals.fixed;

  // Last-7-days daily spend bars (expenses only — income excluded).
  const { dailyBars, dailyAvg } = useMemo(() => {
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sun..Sat
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Build 7 buckets ending today
    const buckets: { d: string; v: number; iso: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      buckets.push({
        d: labels[d.getDay()],
        v: 0,
        iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      });
    }
    for (const tx of transactions) {
      if (tx.main === 'income') continue;
      const idx = buckets.findIndex(b => b.iso === tx.date);
      if (idx >= 0) buckets[idx].v += tx.amount;
    }
    const sum = buckets.reduce((s, b) => s + b.v, 0);
    return { dailyBars: buckets.map(b => ({ d: b.d, v: b.v })), dailyAvg: Math.round(sum / 7) };
  }, [transactions]);

  // Top 3 transactions (expenses) in the filter range
  const topTxs = useMemo(() => {
    return filtered
      .filter(t => t.main !== 'income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [filtered]);

  function confirmDeleteWithdrawal(id: number) {
    Alert.alert('Remove withdrawal?', 'This will refund the amount back into Necessary Fund and Total.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeWithdrawal(id) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <PageBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          year={today.getFullYear()}
          month={today.getMonth()}
          onPrev={() => {}}
          onNext={() => {}}
          title="Statistics"
          showMonthNav={false}
        />

        {/* Total Amount — flat hero with fund-portion progress bar */}
        <View style={styles.totalHeroRow}>
          <Txt variant="microBold" color={v7Text.tertiary} style={styles.eyebrow}>
            TOTAL AMOUNT
          </Txt>
          <Pressable onPress={() => setEditTotalOpen(true)} hitSlop={8} style={styles.editPlain}>
            <Pencil size={13} color={v7Text.tertiary} strokeWidth={2} />
          </Pressable>
        </View>
        <Txt variant="heroDisplay" color={v7Text.primary} style={styles.totalAmount}>
          {fmt(total)}
        </Txt>
        {/* Stacked bar: fund share vs free */}
        <View style={styles.fundBar}>
          <View
            style={{
              width: `${total > 0 ? Math.min(100, (fund / total) * 100) : 0}%`,
              height: '100%',
              backgroundColor: v7Accent.fund,
              opacity: 0.85,
            }}
          />
        </View>
        <View style={styles.fundBarLegend}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.legendDot, { backgroundColor: v7Accent.fund }]} />
            <Txt variant="caption" color={v7Text.secondary}>
              Necessary Fund {total > 0 ? Math.round((fund / total) * 100) : 0}%
            </Txt>
          </View>
          <Txt variant="caption" color={v7Text.tertiary}>
            Free savings {total > 0 ? Math.round(100 - (fund / total) * 100) : 100}%
          </Txt>
        </View>

        {/* Necessary Fund — pastel-glass hero card */}
        <View style={styles.fundCardV7}>
          <LinearGradient
            colors={CATEGORY_GRADIENT.necessary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: v7Surface.blurWash }]} />

          <View style={styles.fundContent}>
            <View style={styles.fundTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.fundIcon, { backgroundColor: v7Accent.fund }]}>
                  <ShieldCheck size={16} color="#FFFFFF" strokeWidth={2.2} />
                </View>
                <View>
                  <Txt variant="microBold" color={v7Accent.fund} style={styles.eyebrow}>
                    NECESSARY FUND
                  </Txt>
                  <Txt variant="caption" color={v7Text.secondary}>
                    For things you really need
                  </Txt>
                </View>
              </View>
              <Pressable
                onPress={() => setEditFundOpen(true)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.fundEditBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Pencil size={13} color={v7Accent.fund} strokeWidth={2} />
              </Pressable>
            </View>

            <View style={styles.fundAmountRow}>
              <Txt variant="heroDisplay" color={v7Text.primary} style={styles.fundAmount}>
                {fmt(fund)}
              </Txt>
              <Txt variant="caption" color={v7Text.secondary}>
                of {fmt(total)}
              </Txt>
            </View>

            <Pressable
              onPress={() => setUseFundOpen(true)}
              disabled={fund <= 0}
              style={({ pressed }) => [
                styles.useFundBtnV7,
                {
                  backgroundColor: fund <= 0 ? 'rgba(255,255,255,0.5)' : v7Accent.fund,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <ArrowUp size={14} color={fund <= 0 ? v7Text.tertiary : '#FFFFFF'} strokeWidth={2.4} />
              <Txt variant="buttonMd" color={fund <= 0 ? v7Text.tertiary : '#FFFFFF'}>
                Use Fund
              </Txt>
            </Pressable>
          </View>
        </View>

        <View style={{ height: space.lg }} />
        <SectionLabel title="Spending breakdown" />

        <DateFilterPills value={preset} onChange={setPreset} />

        {preset === 'custom' && (
          <View style={[styles.customRow, { borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Txt variant="microBold" color={theme.steel} style={{ marginBottom: 4 }}>FROM</Txt>
              <MonthYearInput
                year={custom.startY}
                month={custom.startM}
                onChange={(y, m) => setCustom({ ...custom, startY: y, startM: m })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="microBold" color={theme.steel} style={{ marginBottom: 4 }}>TO</Txt>
              <MonthYearInput
                year={custom.endY}
                month={custom.endM}
                onChange={(y, m) => setCustom({ ...custom, endY: y, endM: m })}
              />
            </View>
          </View>
        )}

        <View style={{ height: space.md }} />

        {/* Income / Expense summary for the filter range */}
        <IncomeExpenseSummary income={totals.income} expense={trueExpense} />

        <View style={{ height: space.md }} />

        {/* By-category card with eyebrow + total spend headline + donut + legend */}
        <View style={styles.byCatCard}>
          <Txt variant="microBold" color={v7Text.secondary} style={styles.eyebrow}>
            BY CATEGORY
          </Txt>
          <Txt variant="heroDisplay" color={v7Text.primary} style={styles.byCatAmount}>
            {fmt(totalSpent)}
          </Txt>
          <Txt variant="caption" color={v7Text.secondary} style={{ marginBottom: 16 }}>
            Total spending · {preset === 'thisMonth' ? 'this month'
              : preset === 'lastMonth' ? 'last month'
              : preset === 'thisYear' ? 'this year'
              : preset === 'allTime' ? 'all time' : 'custom range'}
          </Txt>
          <SpendingDonut
            income={totals.income}
            totals={{
              savings:   totals.savings,
              necessary: totals.necessary,
              living:    totals.living,
              rosca:     totals.rosca,
              fixed:     totals.fixed,
            }}
            centerLabel="TOP"
            centerValue={(() => {
              const entries = Object.entries({
                Savings: totals.savings, Necessary: totals.necessary,
                Living: totals.living, ROSCA: totals.rosca, Fixed: totals.fixed,
              }).sort((a, b) => b[1] - a[1]);
              return entries[0]?.[1] > 0 ? entries[0][0] : '—';
            })()}
          />
        </View>

        <View style={{ height: space.md }} />

        {/* Daily spend bar chart — last 7 days of expenses */}
        <DailySpendBars days={dailyBars} avg={dailyAvg} title="Last 7 days" />

        {/* Top transactions — grouped by date, headers as subtitles */}
        {topTxs.length > 0 && (
          <>
            <View style={{ height: space.xl }} />
            <Txt variant="bodyMdBold" color={v7Text.primary} style={styles.sectionTitle}>
              Top transactions
            </Txt>
            {Object.entries(
              topTxs.reduce<Record<string, typeof topTxs>>((acc, tx) => {
                (acc[tx.date] ??= []).push(tx);
                return acc;
              }, {}),
            )
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([date, txs]) => (
                <View key={date} style={{ marginBottom: space.md }}>
                  <Txt variant="microBold" color={v7Text.tertiary} style={styles.dateGroupHeader}>
                    {formatTopTxDate(date)}
                  </Txt>
                  <View style={{ gap: 8 }}>
                    {txs.map((tx) => (
                      <TransactionRow key={tx.id} tx={tx} hideDate />
                    ))}
                  </View>
                </View>
              ))}
          </>
        )}

        {/* Withdrawals log */}
        {withdrawals.length > 0 && (
          <>
            <View style={{ height: space.xl }} />
            <SectionLabel title="Necessary fund usage" />
            <View style={[styles.withdrawalCard, { borderColor: theme.border }]}>
              {withdrawals
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
                .map((w, i, arr) => (
                  <View key={w.id}>
                    <View style={styles.withdrawalRow}>
                      <View style={{ flex: 1 }}>
                        <Txt variant="bodySmMed" color={theme.ink}>
                          {w.description || 'Used necessary fund'}
                        </Txt>
                        <Txt variant="micro" color={theme.muted} style={{ marginTop: 2 }}>
                          {w.date}
                        </Txt>
                      </View>
                      <Txt variant="bodyMdBold" color={v7Accent.fund}>
                        −{fmt(w.amount, { compact: true })}
                      </Txt>
                      <Pressable onPress={() => confirmDeleteWithdrawal(w.id)} hitSlop={8} style={{ marginLeft: 8 }}>
                        <Trash2 size={13} color={theme.muted} strokeWidth={2} />
                      </Pressable>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: theme.borderSoft }]} />}
                  </View>
                ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <EditAmountSheet
        visible={editTotalOpen}
        title="Edit Total Amount"
        hint="Adjust your overall balance — useful when you want to set a starting value or correct drift."
        initialValue={total}
        onClose={() => setEditTotalOpen(false)}
        onSave={setTotal}
      />
      <EditAmountSheet
        visible={editFundOpen}
        title="Edit Necessary Fund"
        hint="This is a subset of Total. Editing it doesn't change Total — they're two separate trackers."
        initialValue={fund}
        accent={v7Accent.fund}
        onClose={() => setEditFundOpen(false)}
        onSave={setFund}
      />
      <UseNecessaryFundSheet
        visible={useFundOpen}
        fundBalance={fund}
        onClose={() => setUseFundOpen(false)}
        onSave={(w) => addWithdrawal(w)}
      />
    </SafeAreaView>
  );
}

/** Tiny YYYY-MM picker — two text inputs side by side. */
function MonthYearInput({ year, month, onChange }: {
  year: number; month: number; onChange: (y: number, m: number) => void;
}) {
  // Use the native date picker — any day of the picked month sets the
  // (year, month) range. We always normalize back to the 1st.
  const iso = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  return (
    <DatePickerField
      value={iso}
      onChange={(next) => {
        const d = new Date(next + 'T00:00:00');
        onChange(d.getFullYear(), d.getMonth());
      }}
    />
  );
}

const mySty = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1.4 },

  // ── Total (flat hero) ──
  totalHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  editPlain: {
    width: 26, height: 26,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  totalAmount: {
    fontSize: 42,
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: 12,
  },
  fundBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#F1F2F7',
  },
  fundBarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: space.lg,
  },
  legendDot: { width: 7, height: 7, borderRadius: 4 },

  // ── Necessary Fund pastel-glass card ──
  fundCardV7: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: v7Surface.hairline,
  },
  fundContent: { padding: space.lg },
  fundTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  fundIcon: {
    width: 32, height: 32,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  fundEditBtn: {
    width: 30, height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  fundAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 14,
  },
  fundAmount: {
    fontSize: 34,
    letterSpacing: -1,
  },
  useFundBtnV7: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 42,
    borderRadius: 12,
    marginTop: 14,
  },

  // ── By-category card ──
  byCatCard: {
    backgroundColor: v7Surface.plainCard,
    borderRadius: radius.xl,
    padding: 20,
  },
  byCatAmount: {
    fontSize: 28,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  sectionTitle: {
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  dateGroupHeader: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  topTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: v7Surface.plainCard,
    borderRadius: 14,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Other ──
  customRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingVertical: space.md,
  },
  summaryRow: { flexDirection: 'row', gap: space.sm },
  sumCard: {
    flex: 1,
    borderRadius: radius.xl,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  sumLabel: { textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 },
  withdrawalCard: {
    borderRadius: radius.xl,
    backgroundColor: v7Surface.plainCard,
    paddingHorizontal: space.lg,
  },
  withdrawalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    gap: 8,
  },
  divider: { height: 1, marginLeft: 0 },
});
