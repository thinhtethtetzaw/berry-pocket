import { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useTheme } from "../ThemeContext";
import { radius, space, CHART_PALETTE, v7Text, v7Surface } from "../theme";
import { fmt } from "../lib/format";
import { Txt } from "./Txt";

const SEGMENT_COLOR: Record<string, string> = CHART_PALETTE;

const LABELS: Record<string, string> = {
  living: "Living",
  necessary: "Necessary",
  savings: "Savings",
  rosca: "Circles",
  fixed: "Fixed",
};

interface Props {
  income: number;
  totals: {
    savings: number;
    necessary: number;
    living: number;
    rosca: number;
    fixed: number;
  };
  size?: number;
  thickness?: number;
  /** Center label override (e.g. "TOP" / "LEFT"). */
  centerLabel?: string;
  /** Center value override (e.g. "Savings" or a fmt amount). */
  centerValue?: string;
}

/**
 * Donut chart — animated arc draw-on via SVG stroke-dasharray. Each
 * segment is a full circle clipped to its arc-length by a dasharray pair.
 * Progress animates 0 → 1 over 1.1s with cubic ease-out.
 */
export function SpendingDonut({
  income,
  totals,
  size = 140,
  thickness = 20,
  centerLabel,
  centerValue,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;

  // Build segments, sorted by size for visual nicety
  const segments = (Object.entries(totals) as [keyof typeof totals, number][])
    .map(([key, value]) => ({
      key,
      label: LABELS[key] ?? key,
      value,
      color: SEGMENT_COLOR[key] ?? "#ccc",
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const net = income - total;

  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Re-trigger animation whenever total changes
  useEffect(() => {
    const start = Date.now();
    const duration = 1100;
    const tick = () => {
      const k = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setProgress(eased);
      if (k < 1)
        rafRef.current = requestAnimationFrame(tick) as unknown as number;
    };
    setProgress(0);
    rafRef.current = requestAnimationFrame(tick) as unknown as number;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [total]);

  // Default center readout: LEFT / remaining (income − spent).
  // Callers may override with centerLabel + centerValue (e.g. "TOP / Savings").
  const defaultLabel = "LEFT";
  const defaultValue = fmt(Math.abs(net), { compact: true });

  // Compute strokeDasharray + offset for each segment, factoring progress.
  // We rotate the entire <G> -90deg to start at 12 o'clock.
  let acc = 0;
  const arcs = segments.map((seg) => {
    const frac = (seg.value / (total || 1)) * progress;
    const len = C * frac;
    const offset = C * (acc / (total || 1));
    acc += seg.value;
    return { ...seg, len, offset };
  });

  return (
    <View style={[styles.card]}>
      <View style={styles.row}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            <G rotation={-90} originX={cx} originY={cy}>
              {/* track */}
              <Circle
                cx={cx}
                cy={cy}
                r={r}
                stroke="#EEF1F8"
                strokeWidth={thickness}
                fill="none"
              />
              {/* segments */}
              {arcs.map((arc) => (
                <Circle
                  key={arc.key}
                  cx={cx}
                  cy={cy}
                  r={r}
                  stroke={arc.color}
                  strokeWidth={thickness}
                  fill="none"
                  strokeDasharray={`${arc.len} ${C - arc.len}`}
                  strokeDashoffset={-arc.offset}
                  strokeLinecap="round"
                />
              ))}
            </G>
          </Svg>
          {/* Center readout */}
          <View style={[styles.center, { width: size, height: size }]}>
            <Txt
              variant="microBold"
              color={v7Text.tertiary}
              style={styles.eyebrow}
            >
              {centerLabel ?? defaultLabel}
            </Txt>
            <Txt
              variant="headingSm"
              color={v7Text.primary}
              style={styles.centerValue}
            >
              {centerValue ?? defaultValue}
            </Txt>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {segments.length === 0 ? (
            <Txt variant="caption" color={v7Text.tertiary}>
              No spending yet
            </Txt>
          ) : (
            segments.map((seg) => {
              const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
              return (
                <View key={seg.key} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: seg.color }]} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyMd" color={v7Text.primary}>
                      {seg.label}
                    </Txt>
                    <Txt
                      variant="bodyMd"
                      color={v7Text.tertiary}
                      style={{ marginTop: 1 }}
                    >
                      {fmt(seg.value, { compact: true })}
                    </Txt>
                  </View>
                  <Txt variant="caption" color={v7Text.secondary}>
                    {pct}%
                  </Txt>
                </View>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    backgroundColor: v7Surface.plainCard,
    padding: space.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: { textTransform: "uppercase", letterSpacing: 1.2 },
  centerValue: { marginTop: 2 },
  legend: { flex: 1, gap: 9 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
});
