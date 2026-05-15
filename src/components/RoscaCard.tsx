import { Alert, View, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Settings2, CheckCircle2, ArrowDownCircle } from "lucide-react-native";
import { useTheme } from "../ThemeContext";
import {
  radius,
  space,
  CATEGORY_GRADIENT,
  v7Text,
  v7Surface,
  palette,
  v7Accent,
} from "../theme";
import { fmt } from "../lib/format";
import { Txt } from "./Txt";
import type { RoscaConfig } from "../lib/budget";
import { deriveRoscaSchedule } from "../lib/budget";
import { useRoscaReceipts, isCycleReceived } from "../lib/storage";

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
  const { receipts, markReceived, undoReceived } = useRoscaReceipts();
  const received = isCycleReceived(receipts, cfg);
  // Eligible to receive once we're on/past the payout date.
  const canReceive = daysUntilPayout <= 0;

  const payoutLabel = received
    ? "Received ✓"
    : daysUntilPayout > 0
      ? `${daysUntilPayout} days away`
      : "Ready to receive";
  const [c1, c2] = CATEGORY_GRADIENT.rosca;

  function confirmReceive() {
    Alert.alert(
      `Receive ${fmt(schedule.payoutAmount)}?`,
      "This will add the payout to your Total Amount and mark this round as received.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Receive", onPress: () => markReceived(cfg) },
      ],
    );
  }

  function confirmUndo() {
    Alert.alert(
      "Undo receive?",
      `${fmt(schedule.payoutAmount)} will be removed from Total Amount.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Undo",
          style: "destructive",
          onPress: () => undoReceived(cfg),
        },
      ],
    );
  }

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[c1, c2]}
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

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Txt
              variant="microBold"
              color={v7Text.secondary}
              style={styles.eyebrow}
            >
              YOUR CIRCLE
            </Txt>
            <Txt
              variant="heroDisplay"
              color={v7Text.primary}
              style={styles.amount}
            >
              {fmt(schedule.payoutAmount)}
            </Txt>
            <Txt
              variant="caption"
              color={received ? palette.successText : v7Text.secondary}
            >
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
              style={({ pressed }) => [
                styles.cfgBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Settings2 size={15} color={v7Text.primary} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* Receive button — visible whenever we're on/past the payout date */}
        {canReceive && !received && (
          <Pressable
            onPress={confirmReceive}
            style={({ pressed }) => [
              styles.receiveBtn,
              { backgroundColor: v7Text.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <ArrowDownCircle size={16} color="#FFFFFF" strokeWidth={2.4} />
            <Txt variant="buttonMd" color="#FFFFFF">
              Receive payout
            </Txt>
          </Pressable>
        )}
        {received && (
          <View style={styles.receivedRow}>
            <View style={styles.receivedBadge}>
              <CheckCircle2
                size={16}
                color={palette.successText}
                strokeWidth={2.4}
              />
              <Txt variant="bodySmMed" color={palette.white}>
                Payout received
              </Txt>
            </View>
            <Pressable
              onPress={confirmUndo}
              style={({ pressed }) => [
                styles.undoBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Txt variant="bodySmMed" color={v7Text.primary}>
                Undo
              </Txt>
            </Pressable>
          </View>
        )}

        <View
          style={[styles.divider, { backgroundColor: v7Surface.hairline }]}
        />

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Txt
              variant="microBold"
              color={v7Text.tertiary}
              style={styles.metaLabel}
            >
              MONTHLY
            </Txt>
            <Txt variant="bodyMdBold" color={v7Text.primary}>
              {fmt(cfg.monthlyPayment, { compact: true })}
            </Txt>
          </View>
          <View style={styles.metaItem}>
            <Txt
              variant="microBold"
              color={v7Text.tertiary}
              style={styles.metaLabel}
            >
              POSITION
            </Txt>
            <Txt variant="bodyMdBold" color={v7Text.primary}>
              #{cfg.myPosition} of {cfg.groupSize}
            </Txt>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: v7Surface.hairline,
  },
  content: {
    padding: space.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  amount: {
    fontSize: 30,
    letterSpacing: -1,
    marginBottom: 4,
  },
  cfgBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  receiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 44,
    borderRadius: 12,
    marginTop: space.md,
  },
  receivedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: space.md,
  },
  receivedBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: v7Accent.success,
  },
  undoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: v7Surface.hairline,
  },
  divider: { height: 1, marginVertical: space.md },
  meta: {
    flexDirection: "row",
    gap: 22,
  },
  metaItem: { flex: 0 },
  metaLabel: { letterSpacing: 1.4, marginBottom: 3 },
});
