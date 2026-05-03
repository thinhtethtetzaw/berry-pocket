import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../ThemeContext';
import { radius, space, palette } from '../theme';
import { fmt } from '../lib/format';
import { Txt } from './Txt';

// Pastel tones — same light palette as the allocation tile gradients
// so the donut reads as the same "representative color" per category.
const SEGMENT_COLOR: Record<string, string> = {
  living:    '#FFCDB0',  // warm peach  (tile gradient end)
  necessary: '#D8CCFF',  // soft lavender (tile gradient end)
  savings:   '#C4CFFF',  // light periwinkle (tile gradient end)
  rosca:     '#B6D9FF',  // sky blue tint (tile gradient end)
  fixed:     '#D9DEE8',  // light slate (tile gradient end)
};

const LABELS: Record<string, string> = {
  living: 'Living',
  necessary: 'Necessary',
  savings: 'Savings',
  rosca: 'ROSCA',
  fixed: 'Fixed',
};

interface Props {
  income: number;
  totals: { savings: number; necessary: number; living: number; rosca: number; fixed: number };
  size?: number;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutPath(cx: number, cy: number, r: number, ir: number, start: number, end: number): string {
  const gap = 2.5;
  const s = start + gap / 2;
  const e = end - gap / 2;
  if (e <= s) return '';
  const large = e - s > 180 ? 1 : 0;
  const p1 = polarToXY(cx, cy, r, s);
  const p2 = polarToXY(cx, cy, r, e);
  const p3 = polarToXY(cx, cy, ir, e);
  const p4 = polarToXY(cx, cy, ir, s);
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${r} ${r} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${ir} ${ir} 0 ${large} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export function SpendingDonut({ income, totals, size = 160 }: Props) {
  const { theme } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.44;
  const ir = size * 0.28;

  // Build segments ordered by size (largest first, looks cleaner)
  const segments = Object.entries(totals)
    .map(([key, value]) => ({ key, label: LABELS[key] ?? key, value, color: SEGMENT_COLOR[key] ?? '#ccc' }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const net   = income - total;

  let currentAngle = 0;
  const arcs = segments.map(seg => {
    const sweep = (seg.value / (total || 1)) * 360;
    const start = currentAngle;
    const end   = currentAngle + sweep;
    currentAngle = end;
    return { ...seg, start, end };
  });

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.row}>

        {/* ── Donut ── */}
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            {total === 0 ? (
              <Circle
                cx={cx} cy={cy}
                r={(r + ir) / 2}
                fill="none"
                stroke={theme.border}
                strokeWidth={r - ir}
              />
            ) : (
              arcs.map(arc => (
                <Path
                  key={arc.key}
                  d={donutPath(cx, cy, r, ir, arc.start, arc.end)}
                  fill={arc.color}
                />
              ))
            )}
          </Svg>

          {/* Center readout */}
          <View style={[styles.center, { width: ir * 2, height: ir * 2, borderRadius: ir, left: cx - ir, top: cy - ir }]}>
            <Txt variant="micro" color={theme.steel} style={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Left
            </Txt>
            <Txt variant="bodyMdBold" color={net >= 0 ? palette.successText : palette.brandCoral}>
              {fmt(Math.abs(net), { compact: true })}
            </Txt>
          </View>
        </View>

        {/* ── Legend ── */}
        <View style={styles.legend}>
          {segments.length === 0 ? (
            <Txt variant="caption" color={theme.muted}>No spending yet</Txt>
          ) : (
            segments.map(seg => (
              <View key={seg.key} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: seg.color }]} />
                <View style={{ flex: 1 }}>
                  <Txt variant="caption" color={theme.steel}>{seg.label}</Txt>
                  <Txt variant="bodySmMed" color={theme.ink}>{fmt(seg.value, { compact: true })}</Txt>
                </View>
                <Txt variant="caption" color={theme.muted}>
                  {total > 0 ? `${Math.round((seg.value / total) * 100)}%` : ''}
                </Txt>
              </View>
            ))
          )}
          {/* Income reference line */}
          {income > 0 && (
            <View style={[styles.legendRow, styles.incomeRow, { borderTopColor: theme.borderSoft }]}>
              <View style={[styles.dot, { backgroundColor: '#A3F0CC' }]} />
              <View style={{ flex: 1 }}>
                <Txt variant="caption" color={theme.steel}>Income</Txt>
                <Txt variant="bodySmMed" color={palette.successText}>{fmt(income, { compact: true })}</Txt>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxxl,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    padding: space.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flex: 1,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incomeRow: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
});
