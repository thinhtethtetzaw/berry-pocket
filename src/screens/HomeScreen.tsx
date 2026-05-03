import { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Pencil } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { palette, radius, space } from '../theme';
import { useBudget, useFixed, useMonthData, useRosca } from '../lib/storage';
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
import { fmt } from '../lib/format';
import type { Transaction } from '../lib/budget';

export function HomeScreen() {
  const { theme } = useTheme();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [txSheetOpen, setTxSheetOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txSheetDefault, setTxSheetDefault] = useState<import('../lib/budget').MainCategoryId>('living');
  const [roscaCfgOpen, setRoscaCfgOpen] = useState(false);
  const [budgetCfgOpen, setBudgetCfgOpen] = useState(false);
  const [fixedSheetOpen, setFixedSheetOpen] = useState(false);

  const { transactions, add, update, remove } = useMonthData(year, month);
  const { cfg: roscaCfg, update: updateRosca } = useRosca(year, month);
  const { budget, update: updateBudget } = useBudget(year, month);
  const { fixed, update: updateFixed } = useFixed(year, month);

  const totals = useMemo(() => {
    const t = { income: 0, savings: 0, necessary: 0, fixed: 0, rosca: 0, living: 0 };
    for (const tx of transactions) t[tx.main] += tx.amount;
    return t;
  }, [transactions]);

  const totalFixed = fixed.reduce((s, f) => s + f.amount, 0);
  const totalSpent = totals.necessary + totals.living + totals.rosca + totals.fixed + totals.savings;
  const recent = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id - a.id
  ).slice(0, 5);

  function nav(d: number) {
    let m = month + d, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setYear(y); setMonth(m);
  }

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
        <AppHeader year={year} month={month} onPrev={() => nav(-1)} onNext={() => nav(1)} />

        <HeroBalance
          income={budget.income + totals.income}
          spent={totalSpent}
          onAddExpense={openExpense}
          onAddIncome={openIncome}
        />

        <View style={{ height: space.xl }} />
        <SectionLabel
          title="Allocation"
          action={{ label: 'Edit', onPress: () => setBudgetCfgOpen(true) }}
        />
        <View style={styles.grid}>
          <AllocationTile
            main="savings"
            label="Savings"
            icon="TrendingUp"
            budget={budget.savings}
            spent={totals.savings}
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
                  <Pencil size={11} color={theme.muted} strokeWidth={2} style={{ marginLeft: 6 }} />
                </Pressable>
                {i < fixed.length - 1 && <View style={[styles.itemDivider, { backgroundColor: theme.borderSoft }]} />}
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
          <View style={{ gap: 8 }}>
            {recent.map(tx => (
              <TransactionRow key={tx.id} tx={tx} onPress={openEdit} />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
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
        onClose={() => setBudgetCfgOpen(false)}
        onSave={updateBudget}
      />
      <FixedItemsSheet
        visible={fixedSheetOpen}
        items={fixed}
        onClose={() => setFixedSheetOpen(false)}
        onSave={updateFixed}
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
  emptyIcon: {
    width: 48, height: 48,
    borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
});
