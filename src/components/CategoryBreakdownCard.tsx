import { useMemo, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useAllMainCategories, useAllSubCategories } from "../lib/storage";
import { buildMainSegments, buildSubSegments } from "../lib/categoryStats";
import { SpendingDonut } from "./SpendingDonut";
import { Txt } from "./Txt";
import { fmt } from "../lib/format";
import { radius, space, v7Surface, v7Text } from "../theme";
import type { Transaction } from "../lib/budget";

interface Props {
  /** Card title — e.g. "Where money comes from" or "Where money goes". */
  title: string;
  /** Transactions to chart (already date-filtered by the caller). */
  transactions: Transaction[];
  /** Restrict to one side of the ledger.
   *  - "in"  → only mains with type:"in"  (income breakdown)
   *  - "out" → only mains with type:"out" (expense / outflow breakdown) */
  side: "in" | "out";
}

/**
 * Interactive donut card that breaks down spending by main category. Tap a
 * row in the legend to drill into that main's sub-category breakdown; tap
 * "Back" (or the same row) to return to the main view.
 *
 * Source of truth = useAllMainCategories / useAllSubCategories, so any
 * change made under Settings → Manage categories flows here automatically.
 */
export function CategoryBreakdownCard({ title, transactions, side }: Props) {
  const mains = useAllMainCategories();
  const subs = useAllSubCategories();
  const [drilledMain, setDrilledMain] = useState<string | null>(null);

  const mainSegments = useMemo(
    () => buildMainSegments(transactions, mains, side),
    [transactions, mains, side],
  );

  // Parent main object — used for the drill-down title + color base.
  const parent = useMemo(
    () => mains.find((m) => m.id === drilledMain) ?? null,
    [mains, drilledMain],
  );

  const subSegments = useMemo(() => {
    if (!parent) return [];
    return buildSubSegments(transactions, subs, parent);
  }, [transactions, subs, parent]);

  // If the user drilled into a main that's since been deleted, snap back.
  if (drilledMain && !parent) {
    // Defer to next render so we don't update state during render.
    setTimeout(() => setDrilledMain(null), 0);
  }

  const mainTotal = mainSegments.reduce((s, seg) => s + seg.value, 0);
  const subTotal = subSegments.reduce((s, seg) => s + seg.value, 0);

  const inDrill = parent !== null;

  return (
    <View style={S.card}>
      {/* Header */}
      <View style={S.header}>
        <View style={S.titleRow}>
          <Txt variant="microBold" color={v7Text.secondary} style={S.eyebrow}>
            {inDrill
              ? `${parent?.label.toUpperCase()} · BREAKDOWN`
              : title.toUpperCase()}
          </Txt>
          {inDrill && (
            <Pressable
              onPress={() => setDrilledMain(null)}
              hitSlop={10}
              style={({ pressed }) => [
                S.backPill,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <ChevronLeft
                size={14}
                color={v7Text.primary}
                strokeWidth={2.6}
              />
              <Txt variant="microBold" color={v7Text.primary}>
                Back
              </Txt>
            </Pressable>
          )}
        </View>

        <Txt variant="headingMd" color={v7Text.primary} style={S.amount}>
          {fmt(inDrill ? subTotal : mainTotal)}
        </Txt>
        <Txt variant="caption" color={v7Text.secondary}>
          {inDrill
            ? `${parent?.label} sub-categories`
            : "Tap a row to see sub-categories"}
        </Txt>
      </View>

      <SpendingDonut
        segments={inDrill ? subSegments : mainSegments}
        size={140}
        centerLabel={inDrill ? parent?.label.toUpperCase() : "TOTAL"}
        centerValue={fmt(inDrill ? subTotal : mainTotal, { compact: true })}
        onSegmentPress={inDrill ? undefined : (key) => setDrilledMain(key)}
      />
    </View>
  );
}

const S = StyleSheet.create({
  card: {
    backgroundColor: v7Surface.plainCard,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  header: {
    padding: space.md,
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 26,
  },
  eyebrow: { letterSpacing: 1.4, flexShrink: 1 },
  amount: { marginTop: 6, marginBottom: 2 },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#DCE0E8",
    paddingLeft: 6,
    paddingRight: 11,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 0,
  },
});
