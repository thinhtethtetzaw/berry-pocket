// ─────────────────────────────────────────────────────────────────────────
// categoryStats.ts
//   Helpers that turn a list of Transactions + the merged category list into
//   ready-to-render donut segments. Centralised so HomeScreen, StatisticsScreen,
//   MonthRolloverModal, and the new CategoryBreakdownCard all show the SAME
//   data — including custom categories created in Settings → Manage categories.
// ─────────────────────────────────────────────────────────────────────────

import type {
  Transaction,
  MainCategory,
  MainCategoryId,
  SubCategory,
} from "./budget";
import type { CustomMain } from "./storage";
import { CHART_PALETTE, CATEGORY_SOLID } from "../theme";
import type { DonutSegment } from "../components/SpendingDonut";

/**
 * Fallback palette for custom main/sub categories that don't carry an
 * explicit color. Cycled by index. Picked from the warm v13 family so they
 * sit next to the built-in CHART_PALETTE without clashing.
 */
const CUSTOM_PALETTE = [
  "#C8E7D8", // mint
  "#FBD7A0", // amber
  "#F4B5C5", // rose
  "#BFAEFE", // lavender
  "#FCB389", // peach
  "#A9D4F5", // sky
  "#F9E29A", // butter
  "#E8C8F0", // pink-purple
];

function colorForMain(m: MainCategory, fallbackIdx: number): string {
  // Built-in mains get their canonical chart color when available; otherwise
  // fall back to their solid pastel.
  if (m.id in CHART_PALETTE)
    return (CHART_PALETTE as Record<string, string>)[m.id];
  // Custom mains carry their own `color` field (see CustomMain).
  const customColor = (m as CustomMain).color;
  if (customColor) return customColor;
  if (m.id in CATEGORY_SOLID)
    return CATEGORY_SOLID[m.id as MainCategoryId];
  return CUSTOM_PALETTE[fallbackIdx % CUSTOM_PALETTE.length];
}

/**
 * Build donut segments grouped by main category for the given transactions.
 * Pass `filter` to restrict to one side of the ledger ("in" income, "out"
 * everything else). Mains with zero totals are still returned — the donut
 * filters them itself, but callers may want them for legends.
 */
export function buildMainSegments(
  txs: Transaction[],
  mains: MainCategory[],
  filter?: "in" | "out",
): DonutSegment[] {
  const wanted = filter
    ? mains.filter((m) => filter === "out" ? m.type !== "in" : m.type === "in")
    : mains;
  // Index totals by main.id
  const totals: Record<string, number> = {};
  for (const m of wanted) totals[m.id] = 0;
  for (const tx of txs) {
    if (totals[tx.main] !== undefined) {
      totals[tx.main] += tx.amount;
    }
  }
  return wanted.map((m, i) => ({
    key: m.id,
    label: m.label,
    value: totals[m.id] ?? 0,
    color: colorForMain(m, i),
  }));
}

/**
 * Build donut segments grouped by sub-category, scoped to a single main.
 * Sub colors are derived from the parent main's color, varied via the
 * fallback palette so adjacent slices don't blur together.
 */
export function buildSubSegments(
  txs: Transaction[],
  subs: SubCategory[],
  parentMain: MainCategory,
): DonutSegment[] {
  const scoped = subs.filter((s) => s.main === parentMain.id);
  const parentColor = colorForMain(parentMain, 0);
  const totals: Record<string, number> = {};
  for (const s of scoped) totals[s.id] = 0;
  // Also track transactions whose `cat` no longer matches any known sub
  // (e.g. user deleted a sub but transactions still reference it).
  let orphans = 0;
  for (const tx of txs) {
    if (tx.main !== parentMain.id) continue;
    if (totals[tx.cat] !== undefined) {
      totals[tx.cat] += tx.amount;
    } else {
      orphans += tx.amount;
    }
  }
  const segs: DonutSegment[] = scoped.map((s, i) => ({
    key: s.id,
    label: s.label,
    value: totals[s.id] ?? 0,
    // Use parent color for the largest sub, palette variations for the rest.
    color: i === 0 ? parentColor : CUSTOM_PALETTE[i % CUSTOM_PALETTE.length],
  }));
  if (orphans > 0) {
    segs.push({
      key: "__orphan__",
      label: "Other",
      value: orphans,
      color: "#CBD0DC",
    });
  }
  return segs;
}
