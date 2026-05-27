import { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUp, Trash2, ShieldCheck, Wallet } from "lucide-react-native";
import { useTheme } from "../ThemeContext";
import {
  palette,
  radius,
  space,
  CATEGORY_GRADIENT,
  v7Text,
  v7Surface,
  v7Accent,
} from "../theme";
import { DailySpendBars } from "../components/DailySpendBars";
import { IncomeExpenseSummary } from "../components/IncomeExpenseSummary";
import { DatePickerField } from "../components/DatePickerField";
import {
  useTotal,
  useNecessaryFund,
  useNecessaryWithdrawals,
  useAllTransactions,
  useCurrency,
  useAllMainCategories,
} from "../lib/storage";
import { AppHeader } from "../components/AppHeader";
import { PageBackground } from "../components/PageBackground";
import { SectionLabel } from "../components/SectionLabel";
import { CategoryBreakdownCard } from "../components/CategoryBreakdownCard";
import { DateFilterPills, RangePreset } from "../components/DateFilterPills";
import { UseNecessaryFundSheet } from "../components/UseNecessaryFundSheet";
import { Txt } from "../components/Txt";
import { fmt } from "../lib/format";
import type { Transaction } from "../lib/budget";

type DatedTx = Transaction & { year: number; month: number };

interface Range {
  startY: number;
  startM: number;
  endY: number;
  endM: number;
}

function getRange(preset: RangePreset, custom: Range): Range {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (preset === "thisMonth") return { startY: y, startM: m, endY: y, endM: m };
  if (preset === "lastMonth") {
    const lm = m === 0 ? 11 : m - 1;
    const ly = m === 0 ? y - 1 : y;
    return { startY: ly, startM: lm, endY: ly, endM: lm };
  }
  if (preset === "thisYear") return { startY: y, startM: 0, endY: y, endM: 11 };
  if (preset === "allTime")
    return { startY: 1970, startM: 0, endY: 9999, endM: 11 };
  return custom;
}

function inRange(tx: DatedTx, r: Range): boolean {
  const txKey = tx.year * 12 + tx.month;
  return txKey >= r.startY * 12 + r.startM && txKey <= r.endY * 12 + r.endM;
}

export function StatisticsScreen() {
  const { theme } = useTheme();
  useCurrency(); // re-render when currency symbol changes
  const today = new Date();
  const { total } = useTotal();
  const { fund } = useNecessaryFund();
  const {
    withdrawals,
    add: addWithdrawal,
    remove: removeWithdrawal,
  } = useNecessaryWithdrawals();
  const { transactions } = useAllTransactions();
  const mainCategories = useAllMainCategories();

  const [preset, setPreset] = useState<RangePreset>("thisMonth");
  const [custom, setCustom] = useState<Range>({
    startY: today.getFullYear(),
    startM: 0,
    endY: today.getFullYear(),
    endM: today.getMonth(),
  });

  const [useFundOpen, setUseFundOpen] = useState(false);

  const range = useMemo(() => getRange(preset, custom), [preset, custom]);

  const filtered = useMemo(
    () => transactions.filter((t) => inRange(t, range)),
    [transactions, range],
  );

  const totals = useMemo(() => {
    // Built-in slots are kept named so the existing UI (cards / hero) can
    // still reference them directly. Custom mains are accumulated into
    // `customOut` / `customIn` based on their type.
    const t = {
      income: 0,
      savings: 0,
      necessary: 0,
      fixed: 0,
      rosca: 0,
      living: 0,
      customIn: 0,
      customOut: 0,
    };
    // Look up each main's `type` once so we can route unknown ids correctly.
    const typeById: Record<string, "in" | "out"> = {};
    for (const m of mainCategories) typeById[m.id] = m.type;
    const builtin = new Set([
      "income",
      "savings",
      "necessary",
      "fixed",
      "rosca",
      "living",
    ]);
    for (const tx of filtered) {
      if (builtin.has(tx.main)) {
        // Built-in main → use its named slot.
        (t as Record<string, number>)[tx.main] += tx.amount;
      } else if (typeById[tx.main] === "in") {
        t.customIn += tx.amount;
      } else if (typeById[tx.main] === "out") {
        t.customOut += tx.amount;
      }
      // Unknown / deleted main → silently ignored.
    }
    return t;
  }, [filtered, mainCategories]);

  // True expense — savings + necessary are transfers, not expenses.
  // Custom outflow mains are included so user-defined categories count too.
  const trueExpense =
    totals.living + totals.rosca + totals.fixed + totals.customOut;
  // Total income including any custom income mains.
  const totalIncome = totals.income + totals.customIn;

  // Last-7-days daily spend bars (expenses only — income excluded).
  const { dailyBars, dailyAvg } = useMemo(() => {
    const labels = ["S", "M", "T", "W", "T", "F", "S"]; // Sun..Sat
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
        iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      });
    }
    for (const tx of transactions) {
      if (tx.main === "income") continue;
      const idx = buckets.findIndex((b) => b.iso === tx.date);
      if (idx >= 0) buckets[idx].v += tx.amount;
    }
    const sum = buckets.reduce((s, b) => s + b.v, 0);
    return {
      dailyBars: buckets.map((b) => ({ d: b.d, v: b.v })),
      dailyAvg: Math.round(sum / 7),
    };
  }, [transactions]);

  function confirmDeleteWithdrawal(id: number) {
    Alert.alert(
      "Remove withdrawal?",
      "This will refund the amount back into Necessary Fund and Total.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeWithdrawal(id),
        },
      ],
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.bg }}
      edges={["top"]}
    >
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

        {/* Hero row — Total Amount + Necessary Fund as twin pastel cards.
            Editing both lives in Settings → Money. */}
        <View style={styles.heroRow}>
          {/* All my money */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={CATEGORY_GRADIENT.income}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: v7Surface.blurWash },
              ]}
            />
            <View style={styles.heroContent}>
              <View
                style={[styles.heroIcon, { backgroundColor: v7Accent.success }]}
              >
                <Wallet size={15} color="#FFFFFF" strokeWidth={2.4} />
              </View>
              <Txt
                variant="microBold"
                color={v7Accent.success}
                style={styles.heroEyebrow}
              >
                ALL MY MONEY
              </Txt>
              <Txt
                variant="headingLg"
                color={v7Text.primary}
                style={styles.heroAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {fmt(total)}
              </Txt>
            </View>
          </View>

          {/* Necessary Fund */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={CATEGORY_GRADIENT.necessary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: v7Surface.blurWash },
              ]}
            />
            <View style={styles.heroContent}>
              <View
                style={[styles.heroIcon, { backgroundColor: v7Accent.fund }]}
              >
                <ShieldCheck size={15} color="#FFFFFF" strokeWidth={2.4} />
              </View>
              <Txt
                variant="microBold"
                color={v7Accent.fund}
                style={styles.heroEyebrow}
              >
                NECESSARY FUND
              </Txt>
              <Txt
                variant="headingLg"
                color={v7Text.primary}
                style={styles.heroAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {fmt(fund)}
              </Txt>
            </View>
          </View>
        </View>

        {/* Use Fund — full-width action below the two cards */}
        <Pressable
          onPress={() => setUseFundOpen(true)}
          disabled={fund <= 0}
          style={({ pressed }) => [
            styles.useFundBtnV7,
            {
              backgroundColor: fund <= 0 ? v7Surface.plainCard : v7Accent.fund,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <ArrowUp
            size={14}
            color={fund <= 0 ? v7Text.tertiary : "#FFFFFF"}
            strokeWidth={2.4}
          />
          <Txt
            variant="buttonMd"
            color={fund <= 0 ? v7Text.tertiary : "#FFFFFF"}
          >
            Use Necessary Fund
          </Txt>
        </Pressable>

        <View style={{ height: space.lg }} />
        <SectionLabel title="Spending breakdown" />

        <DateFilterPills value={preset} onChange={setPreset} />

        {preset === "custom" && (
          <View style={[styles.customRow, { borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Txt
                variant="microBold"
                color={theme.steel}
                style={{ marginBottom: 4 }}
              >
                FROM
              </Txt>
              <MonthYearInput
                year={custom.startY}
                month={custom.startM}
                onChange={(y, m) =>
                  setCustom({ ...custom, startY: y, startM: m })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Txt
                variant="microBold"
                color={theme.steel}
                style={{ marginBottom: 4 }}
              >
                TO
              </Txt>
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
        <IncomeExpenseSummary income={totalIncome} expense={trueExpense} />

        <View style={{ height: space.md }} />

        {/* Expense breakdown — tap a slice to drill into sub-categories.
            Source = useAllMainCategories / useAllSubCategories, so custom
            categories from Settings show up here automatically. */}
        <CategoryBreakdownCard
          title="Where money goes"
          transactions={filtered}
          side="out"
        />

        <View style={{ height: space.md }} />

        {/* Income breakdown — same drill-down, scoped to income mains. */}
        <CategoryBreakdownCard
          title="Where money comes from"
          transactions={filtered}
          side="in"
        />

        <View style={{ height: space.md }} />

        {/* Daily spend bar chart — last 7 days of expenses */}
        <DailySpendBars days={dailyBars} avg={dailyAvg} title="Last 7 days" />

        {/* Withdrawals log */}
        {withdrawals.length > 0 && (
          <>
            <View style={{ height: space.xl }} />
            <SectionLabel title="Necessary fund usage" />
            <View
              style={[styles.withdrawalCard, { borderColor: theme.border }]}
            >
              {withdrawals
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
                .map((w, i, arr) => (
                  <View key={w.id}>
                    <View style={styles.withdrawalRow}>
                      <View style={{ flex: 1 }}>
                        <Txt variant="bodySmMed" color={theme.ink}>
                          {w.description || "Used necessary fund"}
                        </Txt>
                        <Txt
                          variant="micro"
                          color={theme.muted}
                          style={{ marginTop: 2 }}
                        >
                          {w.date}
                        </Txt>
                      </View>
                      <Txt variant="bodyMdBold" color={v7Accent.fund}>
                        −{fmt(w.amount, { compact: true })}
                      </Txt>
                      <Pressable
                        onPress={() => confirmDeleteWithdrawal(w.id)}
                        hitSlop={8}
                        style={{ marginLeft: 8 }}
                      >
                        <Trash2 size={13} color={theme.muted} strokeWidth={2} />
                      </Pressable>
                    </View>
                    {i < arr.length - 1 && (
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: theme.borderSoft },
                        ]}
                      />
                    )}
                  </View>
                ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

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
function MonthYearInput({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
}) {
  // Use the native date picker — any day of the picked month sets the
  // (year, month) range. We always normalize back to the 1st.
  const iso = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return (
    <DatePickerField
      value={iso}
      onChange={(next) => {
        const d = new Date(next + "T00:00:00");
        onChange(d.getFullYear(), d.getMonth());
      }}
    />
  );
}

const mySty = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    textAlign: "center",
  },
});

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm },
  eyebrow: { textTransform: "uppercase", letterSpacing: 1.4 },

  // ── Twin pastel-glass hero cards ──
  heroRow: {
    flexDirection: "row",
    gap: 12,
  },
  heroCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: v7Surface.hairline,
    minHeight: 152,
  },
  heroContent: {
    padding: space.md,
    gap: 4,
  },
  heroIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  heroEyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  heroAmount: {
    fontSize: 26,
    letterSpacing: -0.8,
    marginTop: 4,
    marginBottom: 2,
  },
  useFundBtnV7: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 44,
    borderRadius: 14,
    marginTop: 12,
  },

  // ── Other ──
  customRow: {
    flexDirection: "row",
    gap: space.sm,
    paddingVertical: space.md,
  },
  summaryRow: { flexDirection: "row", gap: space.sm },
  sumCard: {
    flex: 1,
    borderRadius: radius.xl,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  sumLabel: { textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 },
  withdrawalCard: {
    borderRadius: radius.xl,
    backgroundColor: v7Surface.plainCard,
    paddingHorizontal: space.lg,
  },
  withdrawalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space.md,
    gap: 8,
  },
  divider: { height: 1, marginLeft: 0 },
});
