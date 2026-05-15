import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Pencil } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { palette, radius, space } from '../theme';
import { useBudget, useFixed, useMonthData, useRosca, useLastSeenMonth, useTotal } from '../lib/storage';
import { MonthRolloverModal } from '../components/MonthRolloverModal';
import { Shimmer } from '../components/Shimmer';
import { AppHeader } from '../components/AppHeader';
import { HeroBalance } from '../components/HeroBalance';
import { AllocationTile } from '../components/AllocationTile';
import { SpendingDonut } from '../components/SpendingDonut';
import { SectionLabel } from '../components/SectionLabel';
import { TransactionRow } from '../components/TransactionRow';
import { TransactionSheet } from '../components/TransactionSheet';
import { RoscaConfigSheet } from '../components/RoscaConfigSheet';
import { BudgetConfigSheet } from '../components/BudgetConfigSheet';
import { FixedItemsSheet } from '../components/FixedItemsSheet';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { Txt } from '../components/Txt';
import { PageBackground } from '../components/PageBackground';
import { fmt, MONTHS_SHORT } from '../lib/format';
import type { Transaction } from '../lib/budget';

function formatRecentDateHeader(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const stripped = new Date(d); stripped.setHours(0, 0, 0, 0);
  if (stripped.getTime() === today.getTime()) return 'TODAY';
  if (stripped.getTime() === yesterday.getTime()) return 'YESTERDAY';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()].toUpperCase()}`;
}

export function HomeScreen() {
  const { theme } = useTheme();
  // Home is always pinned to the current real-world month. Time-travel
  // lives on the Statistics tab.
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth();

  const [txSheetOpen, setTxSheetOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txSheetDefault, setTxSheetDefault] = useState<import('../lib/budget').MainCategoryId>('living');
  const [roscaCfgOpen, setRoscaCfgOpen] = useState(false);
  const [budgetCfgOpen, setBudgetCfgOpen] = useState(false);
  const [fixedSheetOpen, setFixedSheetOpen] = useState(false);

  // ── Month rollover modal ──
  const { lastSeen, mark, loaded: lastSeenLoaded } = useLastSeenMonth();
  const [rolloverOpen, setRolloverOpen] = useState(false);
  const currentYYYYMM = `${year}-${String(month + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (!lastSeenLoaded) return;
    // First app open ever → just mark today, no modal.
    if (lastSeen === null) {
      mark(currentYYYYMM);
      return;
    }
    // Same month → nothing to do.
    if (lastSeen >= currentYYYYMM) return;
    // The month has flipped since we last saw the user → show the modal.
    setRolloverOpen(true);
  }, [lastSeenLoaded, lastSeen, currentYYYYMM]);

  // Compute the *previous* month (the one we'll summarize in the modal).
  const prevMonthInfo = useMemo(() => {
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    return { year: py, month: pm };
  }, [year, month]);

  const { transactions, add, update, remove, loading } = useMonthData(year, month);
  const { cfg: roscaCfg, update: updateRosca } = useRosca(year, month);
  const { budget, update: updateBudget } = useBudget(year, month);
  const { fixed, update: updateFixed } = useFixed(year, month);
  const { total } = useTotal();

  const totals = useMemo(() => {
    const t = { income: 0, savings: 0, necessary: 0, fixed: 0, rosca: 0, living: 0 };
    for (const tx of transactions) t[tx.main] += tx.amount;
    return t;
  }, [transactions]);

  const totalFixed = fixed.reduce((s, f) => s + f.amount, 0);
  const totalSpent = totals.necessary + totals.living + totals.rosca + totals.fixed + totals.savings;
  // What will be added to "Total Saved" at end of this month — current
  // month's savings + necessary contributions. Already live in `totals`.
  const endOfMonthDelta = totals.savings + totals.necessary;
  const recent = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id - a.id
  ).slice(0, 5);

  function openExpense() { setTxSheetDefault('living'); setEditingTx(null); setTxSheetOpen(true); }
  function openIncome()  { setTxSheetDefault('income'); setEditingTx(null); setTxSheetOpen(true); }
  function openEdit(tx: Transaction) { setEditingTx(tx); setTxSheetOpen(true); }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <PageBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          year={year}
          month={month}
          onPrev={() => {}}
          onNext={() => {}}
          showMonthNav={false}
        />

        <HeroBalance
          // Income is what you actually recorded this month — no double-count
          // against the configured budget.income (which is now only a target).
          income={totals.income}
          spent={totalSpent}
          totalSaved={total}
          endOfMonth={endOfMonthDelta}
          monthIndex={month}
          onAddExpense={openExpense}
          onAddIncome={openIncome}
        />

        <View style={{ height: space.xl }} />
        <SectionLabel
          title="Allocation"
          action={{ label: 'Edit', onPress: () => setBudgetCfgOpen(true) }}
        />
        <View style={styles.grid}>
          {/* v13 checker pattern — Savings (0) + ROSCA (3) are solid, Necessary (1) + Living (2) are plain. */}
          <AllocationTile
            main="savings"
            label="Savings"
            icon="TrendingUp"
            budget={budget.savings}
            spent={totals.savings}
            solid
          />
          <AllocationTile
            main="necessary"
            label="Necessary"
            icon="Heart"
            budget={budget.necessary}
            spent={totals.necessary}
          />
          <AllocationTile
            main="living"
            label="Living"
            icon="ShoppingBag"
            budget={budget.living}
            spent={totals.living}
          />
          <AllocationTile
            main="rosca"
            label="ROSCA"
            icon="Users"
            budget={roscaCfg.monthlyPayment}
            spent={totals.rosca}
            onPress={() => setRoscaCfgOpen(true)}
            solid
          />
        </View>

        <View style={{ height: space.xl }} />
        <SectionLabel
          title="Fixed expenses"
          action={{ label: 'Manage', onPress: () => setFixedSheetOpen(true) }}
        />
        <Card variant="glass" padding={space.lg}>
          <View style={styles.fixedHeaderRow}>
            <View>
              <Txt variant="cardTitle" color={theme.ink}>Recurring</Txt>
              <Txt variant="caption" color={theme.steel}>Auto every month</Txt>
            </View>
            <Txt variant="headingSm" color={theme.ink}>{fmt(totalFixed)}</Txt>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.borderSoft }]} />
          {fixed.length === 0 ? (
            <Pressable onPress={() => setFixedSheetOpen(true)} style={styles.addInline}>
              <Plus size={14} color={theme.steel} strokeWidth={2} />
              <Txt variant="bodySmMed" color={theme.steel}>Add fixed expense</Txt>
            </Pressable>
          ) : (
            fixed.map((item, i) => (
              <View key={item.id}>
                <Pressable
                  onPress={() => setFixedSheetOpen(true)}
                  style={({ pressed }) => [styles.fixedItem, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <View style={[styles.fixedIcon, { backgroundColor: theme.bgSubtle }]}>
                    <Icon name={item.icon} size={13} color={theme.charcoal} strokeWidth={2} />
                  </View>
                  <Txt variant="bodyMd" color={theme.ink} style={{ flex: 1 }}>{item.label}</Txt>
                  <Txt variant="bodyMdBold" color={theme.ink}>{fmt(item.amount, { compact: true })}</Txt>
                </Pressable>
              </View>
            ))
          )}
        </Card>

        <View style={{ height: space.xl }} />
        <SectionLabel title="Spending overview" />
        <SpendingDonut income={totals.income} totals={{ savings: totals.savings, necessary: totals.necessary, living: totals.living, rosca: totals.rosca, fixed: totals.fixed }} />

        <View style={{ height: space.xl }} />
        <SectionLabel title="Recent activity" />
        {recent.length === 0 ? (
          <Card variant="glass" padding={space.xxl}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.bgElevated, borderColor: theme.border, borderWidth: 1 }]}>
                <Icon name="Inbox" size={20} color={theme.steel} strokeWidth={1.8} />
              </View>
              <Txt variant="bodyMdBold" color={theme.ink} style={{ marginTop: space.sm }}>No activity this month</Txt>
              <Txt variant="bodySm" color={theme.steel} style={{ marginTop: 4 }}>Tap + to add a transaction</Txt>
            </View>
          </Card>
        ) : (
          /* Group by date — date becomes the section subtitle so individual rows don't repeat it */
          Object.entries(
            recent.reduce<Record<string, typeof recent>>((acc, tx) => {
              (acc[tx.date] ??= []).push(tx);
              return acc;
            }, {}),
          )
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, txs]) => (
              <View key={date} style={{ marginBottom: space.md }}>
                <Txt variant="microBold" color={theme.steel} style={styles.dateHeader}>
                  {formatRecentDateHeader(date)}
                </Txt>
                <View style={{ gap: 8 }}>
                  {txs.map(tx => (
                    <TransactionRow key={tx.id} tx={tx} onPress={openEdit} hideDate />
                  ))}
                </View>
              </View>
            ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <TransactionSheet
        visible={txSheetOpen}
        onClose={() => setTxSheetOpen(false)}
        onSave={add}
        editing={editingTx}
        onUpdate={update}
        onDelete={remove}
        defaultMain={txSheetDefault}
      />
      <RoscaConfigSheet
        visible={roscaCfgOpen}
        cfg={roscaCfg}
        onClose={() => setRoscaCfgOpen(false)}
        onSave={updateRosca}
      />
      <BudgetConfigSheet
        visible={budgetCfgOpen}
        budget={budget}
        fixedTotal={totalFixed}
        actualIncome={totals.income}
        roscaTotal={roscaCfg.monthlyPayment}
        onClose={() => setBudgetCfgOpen(false)}
        onSave={updateBudget}
      />
      <FixedItemsSheet
        visible={fixedSheetOpen}
        items={fixed}
        onClose={() => setFixedSheetOpen(false)}
        onSave={updateFixed}
      />

      <MonthRolloverModal
        visible={rolloverOpen}
        prevYear={prevMonthInfo.year}
        prevMonth={prevMonthInfo.month}
        onContinue={() => {
          mark(currentYYYYMM);
          setRolloverOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  fixedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: { height: 1, marginVertical: space.sm },
  fixedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: space.sm,
  },
  fixedIcon: {
    width: 28, height: 28,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  itemDivider: { height: 1, marginLeft: 28 + space.sm },
  addInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.lg,
  },
  dateHeader: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyIcon: {
    width: 48, height: 48,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
});
