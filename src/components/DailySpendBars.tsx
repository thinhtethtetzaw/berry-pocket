import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, space, v7Text, v7Surface, CATEGORY_GRADIENT } from '../theme';
import { fmt } from '../lib/format';
import { Txt } from './Txt';

interface DayBar {
  /** Single-letter day label (M, T, W, T, F, S, S). */
  d: string;
  v: number;
}

interface Props {
  days: DayBar[];
  /** Title shown at top-right ("This week" / "Last 7 days" etc.). */
  title?: string;
  /** Optional average to display at top-right. */
  avg?: number;
}

/**
 * Daily spend bar chart card. Animates bar heights on mount.
 * Highest bar is highlighted with a peach gradient; others are muted slate.
 */
export function DailySpendBars({ days, title = 'This week', avg }: Props) {
  const max = Math.max(1, ...days.map((d) => d.v));
  // One Animated.Value per bar, scaling 0 → 1
  const anims = useRef(days.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      60,
      anims.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Txt variant="microBold" color={v7Text.secondary} style={styles.eyebrow}>
            DAILY SPEND
          </Txt>
          <Txt variant="bodyMdBold" color={v7Text.primary} style={styles.title}>
            {title}
          </Txt>
        </View>
        {typeof avg === 'number' && (
          <Txt variant="caption" color={v7Text.secondary}>
            Avg <Txt variant="bodySmMed" color={v7Text.primary}>{fmt(avg, { compact: true })}</Txt>
          </Txt>
        )}
      </View>

      <View style={styles.barsRow}>
        {days.map((d, i) => {
          const ratio = d.v / max;
          const isHi = d.v === max && d.v > 0;
          const h = anims[i].interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', `${Math.round(ratio * 100)}%`],
          });
          return (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barInner, { height: h }]}>
                  {isHi ? (
                    <LinearGradient
                      colors={CATEGORY_GRADIENT.living as readonly [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, styles.barMuted]} />
                  )}
                </Animated.View>
              </View>
              <Txt
                variant="caption"
                color={isHi ? v7Text.primary : v7Text.tertiary}
                style={{ fontWeight: '600' }}
              >
                {d.d}
              </Txt>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: v7Surface.plainCard,
    borderRadius: radius.xl,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { letterSpacing: -0.3, marginTop: 2 },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 120,
    marginTop: 16,
  },
  barCol: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barInner: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barMuted: {
    backgroundColor: '#EAEDF4',
    borderRadius: 6,
  },
});
