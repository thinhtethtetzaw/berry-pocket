import { useEffect, useRef, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useTheme } from "../ThemeContext";
import { radius, space, v7Text, v7Surface } from "../theme";
import { fmt } from "../lib/format";
import { Txt } from "./Txt";

export interface DonutSegment {
  /** Stable id used for activeKey / onSegmentPress callbacks. */
  key: string;
  label: string;
  value: number;
  color: string;
}

interface Props {
  /** Pre-aggregated slices. Provide labels + colors so the chart stays
   *  decoupled from the category source (built-in vs custom). */
  segments: DonutSegment[];
  /** Optional — when given, the default center readout shows
   *  "LEFT / (income − totalSpent)". */
  income?: number;
  size?: number;
  thickness?: number;
  /** Center label override (e.g. "TOP" / "LIVING"). */
  centerLabel?: string;
  /** Center value override (e.g. fmt amount, or category name). */
  centerValue?: string;
  /** Optional tap handler — called with the segment key. Enables drill-down. */
  onSegmentPress?: (key: string) => void;
  /** Key of the currently focused segment (others dim). */
  activeKey?: string;
}

/**
 * Donut chart — animated arc draw-on via SVG stroke-dasharray. Each
 * segment is a full circle clipped to its arc-length by a dasharray pair.
 * Progress animates 0 → 1 over 1.1s with cubic ease-out.
 *
 * Data-driven: caller supplies `segments` with explicit labels + colors,
 * so custom categories from Settings flow through here automatically.
 */
export function SpendingDonut({
  segments: rawSegments,
  income,
  size = 140,
  thickness = 20,
  centerLabel,
  centerValue,
  onSegmentPress,
  activeKey,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;

  // Filter zero/negative slices, sort largest first.
  const segments = rawSegments
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const net = (income ?? 0) - total;

  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Re-trigger animation whenever total OR the active drill-down changes.
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
  }, [total, activeKey]);

  // Default center readout: LEFT / remaining (income − spent) when income
  // was supplied; otherwise just the total.
  const defaultLabel = income !== undefined ? "LEFT" : "TOTAL";
  const defaultValue =
    income !== undefined
      ? fmt(Math.abs(net), { compact: true })
      : fmt(total, { compact: true });

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
              {arcs.map((arc) => {
                const dim = activeKey != null && activeKey !== arc.key;
                return (
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
                    opacity={dim ? 0.25 : 1}
                  />
                );
              })}
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
              No data yet
            </Txt>
          ) : (
            segments.map((seg) => {
              const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
              const dim = activeKey != null && activeKey !== seg.key;
              const isPressable = !!onSegmentPress;
              const inner = (
                <View
                  style={[styles.legendRow, dim && { opacity: 0.4 }]}
                  key={seg.key}
                >
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
              if (!isPressable) return inner;
              return (
                <Pressable
                  key={seg.key}
                  onPress={() => onSegmentPress?.(seg.key)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                >
                  {inner}
                </Pressable>
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
