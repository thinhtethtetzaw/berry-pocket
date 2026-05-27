import { View, StyleSheet, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "../ThemeContext";
import {
  palette,
  radius,
  space,
  CATEGORY_BRAND,
  v7Accent,
} from "../theme";
import { fmt, formatDate } from "../lib/format";
import type { Transaction } from "../lib/budget";
import {
  useAllMainCategories,
  useAllSubCategories,
  type CustomMain,
} from "../lib/storage";
import { Icon } from "./Icon";
import { Txt } from "./Txt";

interface Props {
  tx: Transaction;
  onPress?: (tx: Transaction) => void;
  inline?: boolean;
  /** If true, hides the date in the meta row (use when rows are grouped by date). */
  hideDate?: boolean;
}

export function TransactionRow({ tx, onPress, inline, hideDate }: Props) {
  const { theme } = useTheme();
  const mainCategories = useAllMainCategories();
  const subCategories = useAllSubCategories();
  const main = mainCategories.find((m) => m.id === tx.main);
  const sub = subCategories.find((s) => s.id === tx.cat);
  // Built-in brand colors are keyed by MainCategoryId; for custom categories
  // we fall back to the user-chosen color saved on the CustomMain itself.
  const brandBg =
    CATEGORY_BRAND[tx.main]?.bg ??
    (main as CustomMain | undefined)?.color ??
    theme.steel;
  const isIncome = main?.type === "in";

  const wrapStyle = inline
    ? { paddingVertical: 10 }
    : {
        backgroundColor: "#FFFFFF",
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: radius.xl,
        paddingVertical: 12,
        paddingHorizontal: 14,
      };

  return (
    <Pressable
      onPress={onPress ? () => onPress(tx) : undefined}
      style={({ pressed }) => [
        styles.wrap,
        wrapStyle,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: "#F5F6FA" }]}>
        <Icon
          name={sub?.icon ?? main?.icon ?? "Circle"}
          size={20}
          color={brandBg}
          strokeWidth={2.2}
        />
      </View>

      <View style={styles.info}>
        <Txt variant="bodyMd" color={theme.ink} numberOfLines={1}>
          {tx.desc || sub?.label || main?.label}
        </Txt>
        <View style={styles.metaRow}>
          <Txt variant="micro" color={theme.steel}>
            {main?.label}
          </Txt>
          {!hideDate && (
            <>
              <View
                style={[styles.dotSep, { backgroundColor: theme.border }]}
              />
              <Txt variant="micro" color={theme.steel}>
                {formatDate(tx.date)}
              </Txt>
            </>
          )}
        </View>
      </View>

      <Txt
        variant="bodyMdBold"
        color={isIncome ? palette.successText : v7Accent.danger}
      >
        {isIncome ? "+" : "−"}
        {fmt(tx.amount, { compact: true })}
      </Txt>

      {onPress && (
        <ChevronRight
          size={18}
          color={theme.muted}
          strokeWidth={2}
          style={{ marginLeft: 2 }}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 6,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
});
