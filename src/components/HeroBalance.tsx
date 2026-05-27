import { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Eye, EyeOff, Plus, Minus } from "lucide-react-native";
import { useTheme } from "../ThemeContext";
import { radius, space, v7Text, v7Surface, v7Accent } from "../theme";
import { fmt, MONTHS_SHORT } from "../lib/format";
import { Txt } from "./Txt";

interface Props {
  income: number;
  spent: number;
  /** Running total across all months (the v1.1 "Total Amount" / net worth) */
  totalSaved?: number;
  /** Amount that will roll into Total when this month closes (savings + necessary this month). */
  endOfMonth?: number;
  /** Month index (0-11) for the "END OF <MONTH> +" label. Defaults to current month. */
  monthIndex?: number;
  onAddExpense?: () => void;
  onAddIncome?: () => void;
}

export function HeroBalance({
  income,
  spent,
  totalSaved,
  endOfMonth,
  monthIndex,
  onAddExpense,
  onAddIncome,
}: Props) {
  const { theme } = useTheme();
  const [hidden, setHidden] = useState(false);
  const remaining = income - spent;

  const showSummary =
    typeof totalSaved === "number" || typeof endOfMonth === "number";
  const monthLabel = (
    monthIndex != null
      ? MONTHS_SHORT[monthIndex]
      : MONTHS_SHORT[new Date().getMonth()]
  ).toUpperCase();

  return (
    <View style={styles.wrap}>
      <Txt variant="cardTitle" color={v7Text.tertiary} style={styles.eyebrow}>
        THIS MONTH BALANCE
      </Txt>

      <View style={styles.amountRow}>
        <Txt variant="heroDisplay" color={v7Text.primary} style={styles.amount}>
          {hidden ? "฿••••••" : fmt(remaining)}
        </Txt>
        <Pressable
          onPress={() => setHidden((h) => !h)}
          hitSlop={12}
          style={styles.eyeBtn}
        >
          {hidden ? (
            <EyeOff size={24} color={v7Text.tertiary} strokeWidth={2} />
          ) : (
            <Eye size={24} color={v7Text.tertiary} strokeWidth={2} />
          )}
        </Pressable>
      </View>

      {showSummary && (
        <View
          style={[styles.summaryPill, { backgroundColor: v7Surface.plainCard }]}
        >
          <View style={styles.summaryCol}>
            <Txt
              variant="microBold"
              color={v7Text.tertiary}
              style={styles.summaryLabel}
            >
              My total
            </Txt>
            <Txt variant="bodyMdBold" color={v7Text.primary}>
              {hidden ? "฿••••••" : `฿${(totalSaved ?? 0).toLocaleString()}`}
            </Txt>
          </View>
          <View
            style={[
              styles.summaryDivider,
              { backgroundColor: v7Surface.hairline },
            ]}
          />
          <View style={styles.summaryCol}>
            <Txt
              variant="microBold"
              color={v7Accent.success}
              style={styles.summaryLabel}
            >
              EOM saving +
            </Txt>
            <Txt variant="bodyMdBold" color={v7Text.primary}>
              {hidden ? "฿••••••" : `฿${(endOfMonth ?? 0).toLocaleString()}`}
            </Txt>
          </View>
        </View>
      )}

      {(onAddExpense || onAddIncome) && (
        <View style={styles.pills}>
          <Pressable
            onPress={onAddExpense}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: v7Text.primary,
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
            onPress={onAddIncome}
            style={({ pressed }) => [
              styles.pill,
              styles.pillOutline,
              {
                borderColor: v7Surface.hairline,
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Plus size={16} color={v7Text.primary} strokeWidth={2.4} />
            <Txt variant="buttonMd" color={v7Text.primary}>
              Income
            </Txt>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: space.lg,
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: space.lg,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    marginBottom: space.md,
  },
  amount: {
    textAlign: "center",
  },
  eyeBtn: {
    padding: 4,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: space.md,
    marginBottom: space.lg,
    alignSelf: "center",
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  summaryDivider: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: space.sm,
  },
  pills: {
    flexDirection: "row",
    gap: space.sm,
    width: "100%",
    paddingHorizontal: space.md,
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
