import { View, StyleSheet, Pressable } from "react-native";
import { Settings2 } from "lucide-react-native";
import { useTheme } from "../ThemeContext";
import { radius, space } from "../theme";
import { fmt } from "../lib/format";
import { Txt } from "./Txt";
import type { RoscaConfig } from "../lib/budget";
import { deriveRoscaSchedule } from "../lib/budget";

const ROSCA_BG = "#D8EEFF";

interface Props {
  cfg: RoscaConfig;
  now: Date;
  onConfigure?: () => void;
}

export function RoscaCard({ cfg, now, onConfigure }: Props) {
  const { theme } = useTheme();
  const schedule = deriveRoscaSchedule(cfg);
  const daysUntilPayout = Math.ceil(
    (schedule.payoutDate.getTime() - now.getTime()) / 86400000,
  );
  const payoutLabel =
    daysUntilPayout > 0 ? `${daysUntilPayout} days away` : "Received";

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      {/* Amount + config on same row, top-aligned */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Txt variant="headingMd" color={theme.ink} style={styles.amount}>
            {fmt(schedule.payoutAmount)}
          </Txt>
          <Txt variant="caption" color={theme.accent}>
            {schedule.payoutDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {"  ·  "}
            {payoutLabel}
          </Txt>
        </View>
        {onConfigure && (
          <Pressable
            onPress={onConfigure}
            hitSlop={16}
            style={[styles.cfgBtn, { backgroundColor: "white" }]}
          >
            <Settings2 size={16} color={theme.steel} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Txt variant="micro" color={theme.steel}>
            Monthly
          </Txt>
          <Txt variant="buttonMd" color={theme.ink}>
            {fmt(cfg.monthlyPayment, { compact: true })}
          </Txt>
        </View>
        <View
          style={[styles.metaDividerV, { backgroundColor: theme.border }]}
        />
        <View style={styles.metaItem}>
          <Txt variant="micro" color={theme.steel}>
            Position
          </Txt>
          <Txt variant="buttonMd" color={theme.ink}>
            #{cfg.myPosition} of {cfg.groupSize}
          </Txt>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxxl,
    borderWidth: 1,
    padding: space.lg,
    backgroundColor: ROSCA_BG,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: space.md,
  },
  cfgBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  amount: { marginBottom: 3 },
  divider: { height: 1, marginBottom: space.md },
  meta: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: { flex: 1, gap: 2 },
  metaDividerV: {
    width: 1,
    height: 28,
    marginHorizontal: space.md,
  },
});
