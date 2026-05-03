import { View, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  Trash2,
  Info,
  SlidersHorizontal,
  Home,
  ChevronRight,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { useTheme } from "../ThemeContext";
import { palette, radius, space } from "../theme";
import { useRosca, useBudget, useFixed } from "../lib/storage";
import { DEFAULT_ROSCA, DEFAULT_BUDGET, DEFAULT_FIXED } from "../lib/budget";
import { fmt } from "../lib/format";
import { AppHeader } from "../components/AppHeader";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { RoscaConfigSheet } from "../components/RoscaConfigSheet";
import { BudgetConfigSheet } from "../components/BudgetConfigSheet";
import { FixedItemsSheet } from "../components/FixedItemsSheet";
import { PageBackground } from "../components/PageBackground";
import { Txt } from "../components/Txt";

export function SettingsScreen() {
  const { theme } = useTheme();
  // Settings page edits the *current real-world* month.
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const { cfg, update: updateRosca } = useRosca(year, month);
  const { budget, update: updateBudget } = useBudget(year, month);
  const { fixed, update: updateFixed } = useFixed(year, month);
  const [roscaOpen, setRoscaOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [fixedOpen, setFixedOpen] = useState(false);

  const totalFixed = fixed.reduce((s, f) => s + f.amount, 0);

  function clearAll() {
    Alert.alert(
      "Clear all data?",
      "This will reset all transactions, budget settings, and ROSCA config. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            // 1. Wipe every namespaced key (transactions + per-month settings for all months)
            const keys = await AsyncStorage.getAllKeys();
            await AsyncStorage.multiRemove(
              keys.filter((k) => k.startsWith("bb:")),
            );
            // 2. Reseed current-month settings to defaults so the in-memory React state
            //    in this screen (and every other screen reading the same keys) refreshes.
            updateBudget(DEFAULT_BUDGET);
            updateFixed(DEFAULT_FIXED);
            updateRosca(DEFAULT_ROSCA);
          },
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
          year={new Date().getFullYear()}
          month={new Date().getMonth()}
          onPrev={() => {}}
          onNext={() => {}}
          title="Settings"
          showMonthNav={false}
        />

        <SectionLabel title="Budget" />
        <Card padding={0}>
          <Row
            iconBg={palette.brandBlue + "18"}
            icon={
              <SlidersHorizontal
                size={16}
                color={palette.brandBlue}
                strokeWidth={2}
              />
            }
            title="Monthly Allocation"
            sub="Set income and category budgets"
            onPress={() => setBudgetOpen(true)}
          />
          <Divider />
          <Row
            iconBg={"#64748B18"}
            icon={
              <Home size={16} color={"#64748B"} strokeWidth={2} />
            }
            title="Fixed Expenses"
            sub={`${fixed.length} ${fixed.length === 1 ? "item" : "items"} · ${fmt(totalFixed)} / mo`}
            onPress={() => setFixedOpen(true)}
          />
          <Divider />
          <Row
            iconBg={"#3B9EFF18"}
            icon={
              <Users size={16} color={"#3B9EFF"} strokeWidth={2} />
            }
            title="ROSCA Group"
            sub={`#${cfg.myPosition} of ${cfg.groupSize} · ${fmt(cfg.monthlyPayment, { compact: true })}/mo`}
            onPress={() => setRoscaOpen(true)}
          />
        </Card>

        <View style={{ height: space.xl }} />

        <SectionLabel title="Data" />
        <Card padding={0}>
          <Row
            iconBg={palette.brandCoral + "18"}
            icon={
              <Trash2 size={16} color={palette.brandCoral} strokeWidth={2} />
            }
            title="Clear All Data"
            titleColor={palette.brandCoral}
            sub="Reset everything to defaults"
            onPress={clearAll}
          />
        </Card>

        <View style={{ height: space.xl }} />

        <SectionLabel title="About" />
        <Card>
          <View style={styles.aboutRow}>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyMdBold" color={theme.ink}>
                BerryPocket
              </Txt>
              <Txt variant="micro" color={theme.muted} style={{ marginTop: 2 }}>
                Personal finance tracker
              </Txt>
            </View>
            <Txt variant="captionBold" color={theme.muted}>
              v1.0
            </Txt>
          </View>
        </Card>

        <View style={{ height: 80 }} />
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
        onClose={() => setBudgetOpen(false)}
        onSave={updateBudget}
      />
      <FixedItemsSheet
        visible={fixedOpen}
        items={fixed}
        onClose={() => setFixedOpen(false)}
        onSave={updateFixed}
      />
    </SafeAreaView>
  );
}

function Row({
  icon,
  iconBg,
  title,
  titleColor,
  sub,
  onPress,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  titleColor?: string;
  sub: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodySmMed" color={titleColor ?? theme.ink}>
          {title}
        </Txt>
        <Txt variant="micro" color={theme.muted} style={{ marginTop: 2 }}>
          {sub}
        </Txt>
      </View>
      <ChevronRight size={16} color={theme.muted} strokeWidth={2} />
    </Pressable>
  );
}

function Divider() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.border,
        marginLeft: space.lg + 36 + space.md,
      }}
    />
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: space.lg,
    gap: space.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  aboutRow: { flexDirection: "row", alignItems: "center" },
});
