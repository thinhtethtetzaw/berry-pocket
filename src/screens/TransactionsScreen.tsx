import { useEffect, useMemo, useState } from "react";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Minus, Plus, ChevronDown } from "lucide-react-native";
import { useTheme } from "../ThemeContext";
import { palette, radius, space } from "../theme";
import {
  useMonthData,
  useCurrency,
  useAllMainCategories,
  useAllSubCategories,
  type CustomMain,
} from "../lib/storage";
import { AppHeader } from "../components/AppHeader";
import { TransactionRow } from "../components/TransactionRow";
import { TransactionSheet } from "../components/TransactionSheet";
import {
  OptionPickerSheet,
  type PickerOption,
} from "../components/OptionPickerSheet";
import { IncomeExpenseSummary } from "../components/IncomeExpenseSummary";
import { PageBackground } from "../components/PageBackground";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { Icon } from "../components/Icon";
import { Txt } from "../components/Txt";
import { fmt, MONTHS_SHORT } from "../lib/format";
import type { MainCategoryId, Transaction } from "../lib/budget";
import { categoryAccent } from "../components/categoryAccent";
import { CATEGORY_BRAND } from "../theme";

export function TransactionsScreen() {
  const { theme } = useTheme();
  useCurrency(); // re-render when currency symbol changes
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [filter, setFilter] = useState<MainCategoryId | "all">("all");
  // Sub-category filter. "all" means no sub-filter applied. Always resets
  // whenever the main filter changes — a sub only makes sense in the context
  // of its parent main.
  const [subFilter, setSubFilter] = useState<string>("all");
  const mainCategories = useAllMainCategories();
  const subCategories = useAllSubCategories();

  // Reset sub-filter whenever the main filter changes.
  useEffect(() => {
    setSubFilter("all");
  }, [filter]);

  // Subs that belong to the currently-selected main (if any).
  const subsForFilter = useMemo(
    () =>
      filter === "all"
        ? []
        : subCategories.filter((s) => s.main === filter),
    [filter, subCategories],
  );

  // OptionPickerSheet expects an `id` + `label` shape. We prepend an "All"
  // option so the user can clear the sub filter without changing the main.
  const subPickerOptions: PickerOption[] = useMemo(
    () => [
      { id: "all", label: "All sub-categories" },
      ...subsForFilter.map((s) => ({ id: s.id, label: s.label })),
    ],
    [subsForFilter],
  );

  const subFilterLabel =
    subFilter === "all"
      ? "All sub-categories"
      : (subsForFilter.find((s) => s.id === subFilter)?.label ?? "All sub-categories");

  // Allow other screens to navigate here with a pre-set filter
  // (e.g. Home → tap "Living" allocation tile → opens Activity filtered to Living).
  const route = useRoute<any>();
  useFocusEffect(
    useCallback(() => {
      const param = route.params?.initialFilter as MainCategoryId | undefined;
      if (param) {
        setFilter(param);
        // Clear so navigating back to Activity manually doesn't keep re-applying it.
        route.params = { ...(route.params ?? {}), initialFilter: undefined };
      }
    }, [route.params?.initialFilter]),
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [sheetDefault, setSheetDefault] = useState<MainCategoryId>("living");
  const [subPickerOpen, setSubPickerOpen] = useState(false);

  const { transactions, add, update, remove } = useMonthData(year, month);

  function openExpense() {
    setSheetDefault("living");
    setEditing(null);
    setSheetOpen(true);
  }
  function openIncome() {
    setSheetDefault("income");
    setEditing(null);
    setSheetOpen(true);
  }
  function openEdit(tx: Transaction) {
    setEditing(tx);
    setSheetOpen(true);
  }

  const filtered = useMemo(() => {
    let out = transactions;
    if (filter !== "all") out = out.filter((t) => t.main === filter);
    if (subFilter !== "all") out = out.filter((t) => t.cat === subFilter);
    return out;
  }, [transactions, filter, subFilter]);

  const totals = useMemo(() => {
    // Savings + Necessary are TRANSFERS to long-term accounts (Total Amount /
    // Necessary Fund), not real expenses — they shouldn't be lumped into the
    // "Expense" total. The summary cards only count actual outflows.
    let income = 0,
      expense = 0;
    for (const tx of filtered) {
      if (tx.main === "income") {
        income += tx.amount;
        continue;
      }
      if (tx.main === "savings") continue; // → Total Amount, not expense
      if (tx.main === "necessary") continue; // → Necessary Fund, not expense
      expense += tx.amount; // living / fixed / rosca
    }
    return { income, expense };
  }, [filtered]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const tx of filtered) {
      if (!map[tx.date]) map[tx.date] = [];
      map[tx.date].push(tx);
    }
    // Days: newest day on top. Within each day: latest entry on top
    // (id is Date.now() at insertion → higher id = more recent).
    for (const date in map) {
      map[date].sort((a, b) => b.id - a.id);
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  function nav(d: number) {
    let m = month + d,
      y = year;
    if (m < 0) {
      m = 11;
      y--;
    }
    if (m > 11) {
      m = 0;
      y++;
    }
    setYear(y);
    setMonth(m);
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
          year={year}
          month={month}
          onPrev={() => nav(-1)}
          onNext={() => nav(1)}
          title="Activity"
          showMonthNav={false}
        />

        {/* Summary */}
        <View style={{ marginBottom: space.lg }}>
          <IncomeExpenseSummary
            income={totals.income}
            expense={totals.expense}
          />
        </View>

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filters,
            { paddingHorizontal: space.lg },
          ]}
          style={{ marginHorizontal: -space.lg }}
        >
          <FilterPill
            label="All"
            active={filter === "all"}
            onPress={() => setFilter("all")}
            color={theme.ink}
          />
          {/* Custom order — Living right after Income (matches the rest after).
              Custom categories (not in `order`) get index -1 from indexOf, which
              sorts them BEFORE built-ins, so we map them to Infinity to push
              them to the end. */}
          {(() => {
            const order: MainCategoryId[] = [
              "income",
              "living",
              "savings",
              "necessary",
              "fixed",
              "rosca",
            ];
            const rank = (id: MainCategoryId) => {
              const i = order.indexOf(id);
              return i === -1 ? Infinity : i;
            };
            return [...mainCategories]
              .sort((a, b) => rank(a.id) - rank(b.id))
              .map((m) => (
                <FilterPill
                  key={m.id}
                  label={m.label}
                  active={filter === m.id}
                  onPress={() => setFilter(m.id)}
                  color={
                    CATEGORY_BRAND[m.id]
                      ? categoryAccent(m.id, "light")
                      : ((m as CustomMain).color ?? theme.ink)
                  }
                  icon={m.icon}
                />
              ));
          })()}
        </ScrollView>

        {/* Sub-category dropdown — only shown when a specific main is active
            and that main has at least one sub-category. Tap to open a
            bottom-sheet picker (same component used in Settings). */}
        {filter !== "all" && subsForFilter.length > 0 && (
          <Pressable
            onPress={() => setSubPickerOpen(true)}
            style={({ pressed }) => [
              styles.subDropdown,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Txt
              variant="microBold"
              color={theme.steel}
              style={styles.subDropdownLabel}
            >
              SUB-CATEGORY
            </Txt>
            <View style={styles.subDropdownValueRow}>
              <Txt
                variant="bodySmMed"
                color={theme.ink}
                numberOfLines={1}
                style={{ flex: 1 }}
              >
                {subFilterLabel}
              </Txt>
              <ChevronDown size={14} color={theme.steel} strokeWidth={2.4} />
            </View>
          </Pressable>
        )}

        {/* Transaction list */}
        {grouped.length === 0 ? (
          <Card padding={space.xxl}>
            <View style={{ alignItems: "center" }}>
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor: theme.bgSubtle,
                    borderColor: theme.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Icon
                  name="Inbox"
                  size={22}
                  color={theme.steel}
                  strokeWidth={1.8}
                />
              </View>
              <Txt
                variant="bodyMdBold"
                color={theme.ink}
                style={{ marginTop: space.md }}
              >
                No transactions
              </Txt>
              <Txt
                variant="caption"
                color={theme.steel}
                style={{ marginTop: 4 }}
              >
                {filter === "all"
                  ? "Tap + to add your first one"
                  : "Try a different filter"}
              </Txt>
            </View>
          </Card>
        ) : (
          grouped.map(([date, txs]) => (
            <View key={date} style={{ marginBottom: space.lg }}>
              <Txt
                variant="microBold"
                color={theme.steel}
                style={styles.dateHeader}
              >
                {formatDateHeader(date)}
              </Txt>
              <View style={{ gap: 8 }}>
                {txs.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    onPress={openEdit}
                    hideDate
                  />
                ))}
              </View>
            </View>
          ))
        )}

        <View style={{ height: Platform.OS === "ios" ? 180 : 160 }} />
      </ScrollView>

      {/* Bottom action bar — same pill style as Home page HeroBalance */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={openExpense}
          style={({ pressed }) => [
            styles.pill,
            {
              backgroundColor: theme.ink,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Minus size={16} color="#FFFFFF" strokeWidth={2.4} />
          <Txt variant="buttonMd" color="#FFFFFF">
            Expense
          </Txt>
        </Pressable>
        <Pressable
          onPress={openIncome}
          style={({ pressed }) => [
            styles.pill,
            styles.pillOutline,
            {
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Plus size={16} color={theme.ink} strokeWidth={2.4} />
          <Txt variant="buttonMd" color={theme.ink}>
            Income
          </Txt>
        </Pressable>
      </View>

      <TransactionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={add}
        editing={editing}
        onUpdate={update}
        onDelete={remove}
        defaultMain={sheetDefault}
      />

      {/* Sub-category picker — opened from the dropdown trigger above. */}
      <OptionPickerSheet
        visible={subPickerOpen}
        title="Filter by sub-category"
        options={subPickerOptions}
        selected={subFilter}
        onClose={() => setSubPickerOpen(false)}
        onSelect={(id) => setSubFilter(id)}
      />
    </SafeAreaView>
  );
}

function FilterPill({
  label,
  active,
  onPress,
  color,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color: string;
  icon?: string;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterPill,
        {
          // v7 — every active filter pill is solid black, same as "All"
          backgroundColor: active ? theme.ink : "#F4F5FA",
          borderColor: active ? theme.ink : "transparent",
        },
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={12}
          color={active ? "#FFFFFF" : theme.steel}
          strokeWidth={2}
        />
      )}
      <Txt variant="bodyMd" color={active ? "#FFFFFF" : theme.ink}>
        {label}
      </Txt>
    </Pressable>
  );
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dStripped = new Date(d);
  dStripped.setHours(0, 0, 0, 0);
  if (dStripped.getTime() === today.getTime()) return "TODAY";
  if (dStripped.getTime() === yesterday.getTime()) return "YESTERDAY";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm },
  summaryRow: { flexDirection: "row", gap: space.sm, marginBottom: space.lg },
  sumCard: {
    flex: 1,
    borderRadius: radius.xl,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  sumLabel: { textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 },
  filters: { flexDirection: "row", gap: 6, marginBottom: space.sm },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  // Sub-category dropdown trigger — visually one tier below the main pill
  // row. Light card-style background with an eyebrow + value + chevron.
  subDropdown: {
    backgroundColor: "#F4F5FA",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: space.lg,
  },
  subDropdownLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  subDropdownValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateHeader: {
    textTransform: "uppercase",
    marginBottom: space.sm,
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 16,
    flexDirection: "row",
    gap: space.sm,
    justifyContent: "center",
  },
  pill: {
    flex: 1,
    maxWidth: 160,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 14,
  },
  pillOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },
});
