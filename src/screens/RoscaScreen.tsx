import { useState } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings2 } from "lucide-react-native";
import { useTheme } from "../ThemeContext";
import { space } from "../theme";
import { useRosca, useCurrency } from "../lib/storage";
import { deriveRoscaSchedule } from "../lib/budget";
import { fmt, MONTHS_SHORT } from "../lib/format";
import { AppHeader } from "../components/AppHeader";
import { Card } from "../components/Card";
import { SectionLabel } from "../components/SectionLabel";
import { RoscaCard } from "../components/RoscaCard";
import { RoscaConfigSheet } from "../components/RoscaConfigSheet";
import { PageBackground } from "../components/PageBackground";
import { Txt } from "../components/Txt";
import { palette, radius } from "../theme";

export function RoscaScreen() {
  const { theme } = useTheme();
  useCurrency(); // re-render when currency symbol changes
  const today = new Date();
  const { cfg, update } = useRosca(today.getFullYear(), today.getMonth());
  const [configOpen, setConfigOpen] = useState(false);
  const schedule = deriveRoscaSchedule(cfg);

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
          title="ROSCA"
          showMonthNav={false}
        />

        <RoscaCard
          cfg={cfg}
          now={today}
          onConfigure={() => setConfigOpen(true)}
        />

        <View style={{ height: space.xl }} />
        <SectionLabel title="Schedule" />
        <Card padding={0}>
          {schedule.months.map((m, i) => {
            const paid = m.date < today;
            const current =
              m.month === today.getMonth() && m.year === today.getFullYear();
            const isPayout = m.isPayout;

            return (
              <View key={i}>
                <View style={styles.scheduleRow}>
                  <View
                    style={[
                      styles.numCircle,
                      {
                        backgroundColor: isPayout
                          ? palette.successText + "18"
                          : paid
                            ? theme.bgSubtle
                            : "transparent",
                        borderColor:
                          current || isPayout
                            ? palette.successText
                            : theme.border,
                      },
                    ]}
                  >
                    <Txt
                      variant="captionBold"
                      color={
                        isPayout
                          ? palette.successText
                          : paid
                            ? theme.ink
                            : theme.muted
                      }
                    >
                      {i + 1}
                    </Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyMd" color={theme.ink}>
                      {MONTHS_SHORT[m.month]} {m.year}
                      {isPayout && (
                        <Txt variant="caption" color={palette.successText}>
                          {" "}
                          · My Round
                        </Txt>
                      )}
                    </Txt>
                    <Txt variant="micro" color={theme.steel}>
                      Day {cfg.startDay}
                    </Txt>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    {isPayout ? (
                      <>
                        <Txt variant="bodyMdBold" color={palette.successText}>
                          +{fmt(schedule.payoutAmount, { compact: true })}
                        </Txt>
                        <Txt variant="micro" color={theme.steel}>
                          net 0
                        </Txt>
                      </>
                    ) : (
                      <>
                        <Txt variant="bodyMd" color={theme.ink}>
                          −{fmt(cfg.monthlyPayment, { compact: true })}
                        </Txt>
                        <Txt
                          variant="micro"
                          color={paid ? palette.successText : theme.steel}
                        >
                          {paid ? "paid" : "pending"}
                        </Txt>
                      </>
                    )}
                  </View>
                </View>
                {i < schedule.months.length - 1 && (
                  <View
                    style={[
                      styles.scheduleDivider,
                      { backgroundColor: theme.border },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </Card>

        <View style={{ height: space.xl }} />
        <SectionLabel title="Overview" />
        <View style={styles.statGrid}>
          <StatCard
            label="GROUP SIZE"
            value={`${cfg.groupSize}`}
            unit="people"
          />
          <StatCard
            label="MY POSITION"
            value={`#${cfg.myPosition}`}
            unit={`of ${cfg.groupSize}`}
          />
          <StatCard label="DURATION" value={`${cfg.groupSize}`} unit="months" />
          <StatCard
            label="MONTHLY"
            value={fmt(cfg.monthlyPayment, { compact: true }).replace("฿", "")}
            unit="฿/mo"
          />
        </View>

        <Pressable
          onPress={() => setConfigOpen(true)}
          style={({ pressed }) => [
            styles.cfgBtn,
            { backgroundColor: theme.ink, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Settings2 size={14} color="#FFFFFF" strokeWidth={2} />
          <Txt variant="buttonMd" color="#FFFFFF">
            Configure ROSCA
          </Txt>
        </Pressable>

        <View style={{ height: 80 }} />
      </ScrollView>

      <RoscaConfigSheet
        visible={configOpen}
        cfg={cfg}
        onClose={() => setConfigOpen(false)}
        onSave={update}
      />
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  const { theme } = useTheme();
  return (
    <Card padding={space.md} style={{ flex: 1, minWidth: "47%" }}>
      <Txt variant="microBold" color={theme.steel} style={styles.statLabel}>
        {label}
      </Txt>
      <View style={styles.statValueRow}>
        <Txt variant="cardTitle" color={theme.ink}>
          {value}
        </Txt>
        <Txt variant="micro" color={theme.charcoal}>
          {unit}
        </Txt>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: space.lg, paddingTop: space.sm },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  numCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleDivider: {
    height: 1,
    // full width — no left indent
    marginHorizontal: 0,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginBottom: space.lg,
  },
  statLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  cfgBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.full,
  },
});
