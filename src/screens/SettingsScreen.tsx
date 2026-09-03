import { View, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  Sun,
  Users,
  Home,
  Trash2,
  PiggyBank,
  Filter,
  Upload,
  Download,
  RotateCcw,
  Wallet,
  ShieldCheck,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// expo-file-system v19+ moved the legacy `cacheDirectory` API to a separate path.
// The legacy API is what we want — simple writeAsStringAsync / readAsStringAsync.
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useState, useMemo } from "react";
import { useTheme } from "../ThemeContext";
import { space, v7Text, v7Surface, v7Accent } from "../theme";
import {
  useRosca,
  useBudget,
  useFixed,
  useCurrency,
  useThemePref,
  ThemePref,
  exportAllData,
  parseImportBundle,
  importAllData,
  resetConfigOnly,
  clearAllData,
  useMonthData,
  useTotal,
  useNecessaryFund,
  useCustomSavingFunds,
} from "../lib/storage";
import { DEFAULT_ROSCA, DEFAULT_BUDGET, DEFAULT_FIXED } from "../lib/budget";
import { fmt } from "../lib/format";
import { AppHeader } from "../components/AppHeader";
import { RoscaConfigSheet } from "../components/RoscaConfigSheet";
import { BudgetConfigSheet } from "../components/BudgetConfigSheet";
import { FixedItemsSheet } from "../components/FixedItemsSheet";
import { PageBackground } from "../components/PageBackground";
import { Txt } from "../components/Txt";
import { Icon } from "../components/Icon";
import { OptionPickerSheet } from "../components/OptionPickerSheet";
import { EditAmountSheet } from "../components/EditAmountSheet";
import { CategoriesViewerSheet } from "../components/CategoriesViewerSheet";
import { CategoryEditorSheet } from "../components/CategoryEditorSheet";
import { SubCategoryEditorSheet } from "../components/SubCategoryEditorSheet";
import { useCustomMains, useCustomSubs, CustomMain } from "../lib/storage";
import type { SubCategory } from "../lib/budget";

// Pure symbol options — no exchange-rate conversion happens.
// Switching just replaces the symbol shown before each amount.
const CURRENCY_OPTIONS = [
  { id: "฿", label: "฿ Baht symbol" },
  { id: "$", label: "$ Dollar symbol" },
  { id: "€", label: "€ Euro symbol" },
  { id: "¥", label: "¥ Yen symbol" },
];

const THEME_OPTIONS: {
  id: ThemePref;
  label: string;
  sub?: string;
  disabled?: boolean;
}[] = [
  { id: "light", label: "Light", sub: "Always light" },
  { id: "dark", label: "Dark", sub: "Coming soon", disabled: true },
  { id: "system", label: "System", sub: "Match device", disabled: true },
];

export function SettingsScreen() {
  const { theme } = useTheme();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const { cfg, update: updateRosca } = useRosca(year, month);
  const { budget, update: updateBudget } = useBudget(year, month);
  const { fixed, update: updateFixed } = useFixed(year, month);
  // Need this month's transactions to compute actualIncome for the budget sheet.
  const { transactions } = useMonthData(year, month);
  const actualIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.main === "income")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const { currency, setCurrency } = useCurrency();
  const { themePref, setThemePref } = useThemePref();
  const { total, setManual: setTotal } = useTotal();
  const { fund, setManual: setFund } = useNecessaryFund();
  const {
    savingCategories,
    balances: customSavingBalances,
    setManual: setCustomSavingAmount,
  } = useCustomSavingFunds();

  const [roscaOpen, setRoscaOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [fixedOpen, setFixedOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [editTotalOpen, setEditTotalOpen] = useState(false);
  const [editFundOpen, setEditFundOpen] = useState(false);
  const [editingCustomFundId, setEditingCustomFundId] = useState<string | null>(null);

  // Category editor state (hoisted up so editors are siblings of the manager,
  // not nested — gorhom doesn't reliably handle nested BottomSheetModals)
  const { upsert: upsertMain, remove: removeMain } = useCustomMains();
  const { upsert: upsertSub, remove: removeSub } = useCustomSubs();
  const [mainEditor, setMainEditor] = useState<{
    open: boolean;
    editing: CustomMain | null;
  }>({
    open: false,
    editing: null,
  });
  const [subEditor, setSubEditor] = useState<{
    open: boolean;
    editing: SubCategory | null;
    parent: string;
    color?: string;
  }>({ open: false, editing: null, parent: "" });

  const totalFixed = fixed.reduce((s, f) => s + f.amount, 0);

  async function handleExport() {
    try {
      const json = await exportAllData();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `berrypocket-${stamp}.json`;
      const uri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, json);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: "Export BerryPocket data",
          UTI: "public.json",
        });
      } else {
        Alert.alert("Saved", `File saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert(
        "Export failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;

      const raw = await FileSystem.readAsStringAsync(file.uri);
      const bundle = parseImportBundle(raw);

      const txCount = Object.keys(bundle.data).filter((k) =>
        k.startsWith("bb:month:"),
      ).length;
      const exportedDate = new Date(bundle.exportedAt).toLocaleString();

      Alert.alert(
        "Import this backup?",
        `Exported: ${exportedDate}\nMonths of transactions: ${txCount}\n\nThis will OVERWRITE your current data. This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Replace all",
            style: "destructive",
            onPress: async () => {
              try {
                await importAllData(bundle);
                Alert.alert(
                  "Imported",
                  "Your data was restored from the backup.",
                );
              } catch (err) {
                Alert.alert(
                  "Import failed",
                  err instanceof Error ? err.message : "Unknown error",
                );
              }
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        "Import failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    }
  }

  function handleResetConfig() {
    Alert.alert(
      "Reset all configuration?",
      "Budget targets, fixed expenses, ROSCA, currency, and theme go back to defaults.\n\nYour transactions and Total Amount are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => resetConfigOnly(),
        },
      ],
    );
  }

  function handleClearAll() {
    Alert.alert(
      "Clear ALL data?",
      "This wipes every transaction, every saved budget and configuration, your Total Amount, Necessary Fund, withdrawals and ROSCA receipts — everything goes back to a fresh install.\n\nThis cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear everything",
          style: "destructive",
          onPress: () => clearAllData(),
        },
      ],
    );
  }

  // Display labels
  const themeLabel = themePref.charAt(0).toUpperCase() + themePref.slice(1);

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
          onPrev={() => {}}
          onNext={() => {}}
          title="Settings"
          showMonthNav={false}
        />

        {/* ── Appearance ── */}
        <SectionTitle>Appearance</SectionTitle>
        <View style={styles.group}>
          <Row
            icon={<Sun size={17} color={v7Text.primary} strokeWidth={3} />}
            title="Theme"
            sub={themeLabel}
            onPress={() => setThemeOpen(true)}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
            last
          />
        </View>

        {/* ── Money ── */}
        <SectionTitle>Money</SectionTitle>
        <View style={styles.group}>
          <Row
            icon={<Wallet size={15} color={v7Text.primary} strokeWidth={3} />}
            title="Total amount"
            sub={`${fmt(total)} · all money you have`}
            onPress={() => setEditTotalOpen(true)}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
          />
          {savingCategories.map((category) => (
            <View key={category.id}>
              <Hairline />
              <Row
                icon={<Icon name={category.icon} size={15} color={v7Text.primary} strokeWidth={2.5} />}
                title={`${category.label} fund`}
                sub={`${fmt(customSavingBalances[category.id] ?? 0)} · shared savings`}
                onPress={() => setEditingCustomFundId(category.id)}
                right={<ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />}
              />
            </View>
          ))}
          <Hairline />
          <Row
            icon={
              <ShieldCheck
                size={15}
                color={v7Text.primary}
                strokeWidth={3}
              />
            }
            title="Necessary fund"
            sub={`${fmt(fund)} · for things you really need`}
            onPress={() => setEditFundOpen(true)}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
          />
          <Hairline />
          <Row
            icon={
              <Txt variant="bodyMdBold" color={v7Text.primary}>
                {currency}
              </Txt>
            }
            title="Currency symbol"
            sub={`Change currency symbol`}
            onPress={() => setCurrencyOpen(true)}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
          />
          <Hairline />
          <Row
            icon={
              <PiggyBank size={17} color={v7Text.primary} strokeWidth={3} />
            }
            title="Monthly allocation"
            sub="Set income and category budgets"
            onPress={() => setBudgetOpen(true)}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
          />
          <Hairline />
          <Row
            icon={<Home size={15} color={v7Text.primary} strokeWidth={3} />}
            title="Fixed expenses"
            sub={`${fixed.length} ${fixed.length === 1 ? "item" : "items"} · ${fmt(totalFixed)} / mo`}
            onPress={() => setFixedOpen(true)}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
          />
          <Hairline />
          <Row
            icon={<Users size={15} color={v7Text.primary} strokeWidth={3} />}
            title="ROSCA"
            sub={`#${cfg.myPosition} of ${cfg.groupSize} · ${fmt(cfg.monthlyPayment, { compact: true })}/mo`}
            onPress={() => setRoscaOpen(true)}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
            last
          />
        </View>

        {/* ── Categories ── */}
        <SectionTitle>Categories</SectionTitle>
        <View style={styles.group}>
          <Row
            icon={<Filter size={14} color={v7Text.primary} strokeWidth={3} />}
            title="Manage categories"
            sub="View built-in categories"
            onPress={() => setCatsOpen(true)}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
            last
          />
        </View>

        {/* ── Backup ── */}
        <SectionTitle>Backup</SectionTitle>
        <View style={styles.group}>
          <Row
            icon={<Upload size={14} color={v7Text.primary} strokeWidth={3} />}
            title="Export data"
            sub="Save a JSON backup file"
            onPress={handleExport}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
          />
          <Hairline />
          <Row
            icon={<Download size={14} color={v7Text.primary} strokeWidth={3} />}
            title="Import data"
            sub="Restore from a JSON backup"
            onPress={handleImport}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
            last
          />
        </View>

        {/* ── Data ── */}
        <SectionTitle>Data</SectionTitle>
        <View style={styles.group}>
          <Row
            icon={
              <RotateCcw size={14} color={v7Text.primary} strokeWidth={3} />
            }
            title="Reset all configuration"
            sub="Settings → defaults"
            onPress={handleResetConfig}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
          />
          <Hairline />
          <Row
            icon={<Trash2 size={14} color={v7Accent.danger} strokeWidth={3} />}
            iconTint={v7Accent.dangerSoft}
            title="Clear all data"
            sub="Wipe everything"
            danger
            onPress={handleClearAll}
            right={
              <ChevronRight size={14} color={v7Text.tertiary} strokeWidth={3} />
            }
            last
          />
        </View>

        <View style={styles.footer}>
          <Txt
            variant="caption"
            color={v7Text.tertiary}
            style={{ textAlign: "center" }}
          >
            BerryPocket · v1.1
          </Txt>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <RoscaConfigSheet
        visible={roscaOpen}
        cfg={cfg}
        onClose={() => setRoscaOpen(false)}
        onSave={updateRosca}
      />
      <BudgetConfigSheet
        visible={budgetOpen}
        budget={budget}
        fixedTotal={totalFixed}
        actualIncome={actualIncome}
        roscaTotal={cfg.monthlyPayment}
        onClose={() => setBudgetOpen(false)}
        onSave={updateBudget}
      />
      <FixedItemsSheet
        visible={fixedOpen}
        items={fixed}
        onClose={() => setFixedOpen(false)}
        onSave={updateFixed}
      />

      {/* Balance editors */}
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
      <EditAmountSheet
        visible={!!editingCustomFundId}
        title={`Edit ${savingCategories.find(c => c.id === editingCustomFundId)?.label ?? "Savings"} Fund`}
        hint="This is a subset of Total. Editing it doesn't change Total — they're two separate trackers."
        initialValue={editingCustomFundId ? (customSavingBalances[editingCustomFundId] ?? 0) : 0}
        accent={savingCategories.find(c => c.id === editingCustomFundId)?.color}
        onClose={() => setEditingCustomFundId(null)}
        onSave={(amount) => {
          if (editingCustomFundId) setCustomSavingAmount(editingCustomFundId, amount);
        }}
      />

      {/* Preference pickers */}
      <OptionPickerSheet
        visible={currencyOpen}
        title="Currency symbol"
        hint="Changes the symbol shown before every amount. Values are NOT converted — ฿1,000 becomes $1,000 (just the label changes)."
        options={CURRENCY_OPTIONS}
        selected={currency}
        onClose={() => setCurrencyOpen(false)}
        onSelect={(id) => setCurrency(id)}
      />
      <OptionPickerSheet<ThemePref>
        visible={themeOpen}
        title="Theme"
        hint="Light mode is the only one ready right now."
        options={THEME_OPTIONS}
        selected={themePref}
        onClose={() => setThemeOpen(false)}
        onSelect={(id) => setThemePref(id)}
      />
      <CategoriesViewerSheet
        visible={catsOpen}
        onClose={() => setCatsOpen(false)}
        /* iOS can't reliably show two RN Modals stacked — so when the user
           taps Add/Edit, we DISMISS the manager first, open the editor
           after a short delay for the slide-down animation, then reopen
           the manager when the editor closes. Same for sub-categories. */
        onEditMain={(editing) => {
          setCatsOpen(false);
          setTimeout(() => setMainEditor({ open: true, editing }), 320);
        }}
        onEditSub={(editing, parent, color) => {
          setCatsOpen(false);
          setTimeout(
            () => setSubEditor({ open: true, editing, parent, color }),
            320,
          );
        }}
      />

      <CategoryEditorSheet
        visible={mainEditor.open}
        editing={mainEditor.editing}
        onClose={() => {
          setMainEditor({ open: false, editing: null });
          setTimeout(() => setCatsOpen(true), 320);
        }}
        onSave={(cat) => upsertMain(cat)}
        onDelete={mainEditor.editing ? (id) => removeMain(id) : undefined}
      />

      <SubCategoryEditorSheet
        visible={subEditor.open}
        parentMain={subEditor.parent}
        parentColor={subEditor.color}
        editing={subEditor.editing}
        onClose={() => {
          setSubEditor({ open: false, editing: null, parent: "" });
          setTimeout(() => setCatsOpen(true), 320);
        }}
        onSave={(sub) => upsertSub(sub)}
        onDelete={subEditor.editing ? (id) => removeSub(id) : undefined}
      />
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Txt
      variant="captionBold"
      color={v7Text.tertiary}
      style={styles.sectionTitle}
    >
      {children.toUpperCase()}
    </Txt>
  );
}

function Row({
  icon,
  iconTint,
  title,
  sub,
  right,
  onPress,
  danger,
  last,
}: {
  icon: React.ReactNode;
  iconTint?: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const inner = (
    <View style={styles.row}>
      <View
        style={[styles.iconWrap, { backgroundColor: iconTint ?? "#F5F6FA" }]}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyMd" color={danger ? v7Accent.danger : v7Text.primary}>
          {title}
        </Txt>
        {sub ? (
          <Txt
            variant="micro"
            color={v7Text.tertiary}
            style={{ marginTop: 1.5 }}
          >
            {sub}
          </Txt>
        ) : null}
      </View>
      {right ?? null}
    </View>
  );

  if (!onPress) return inner;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
    >
      {inner}
    </Pressable>
  );
}

function Hairline() {
  return <View style={styles.hairline} />;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm },
  sectionTitle: {
    letterSpacing: 1.4,
    paddingTop: 14,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  group: {
    backgroundColor: v7Surface.plainCard,
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  hairline: {
    height: 1,
    marginLeft: 12 + 32 + 12,
    backgroundColor: v7Surface.hairline,
  },
  footer: {
    paddingTop: 30,
    paddingBottom: 10,
    alignItems: "center",
  },
});
