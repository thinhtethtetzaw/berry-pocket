import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings2 } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { radius, space, CATEGORY_GRADIENT, v7Text, v7Surface } from '../theme';
import { fmt } from '../lib/format';
import { Txt } from './Txt';
import type { RoscaConfig } from '../lib/budget';
import { deriveRoscaSchedule } from '../lib/budget';

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
  const payoutLabel = daysUntilPayout > 0 ? `${daysUntilPayout} days away` : 'Received';
  const [c1, c2] = CATEGORY_GRADIENT.rosca;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* 22% white frosted wash */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: v7Surface.blurWash }]} />

      <View style={styles.content}>
        {/* Eyebrow + config */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Txt variant="microBold" color={v7Text.secondary} style={styles.eyebrow}>
              YOUR CIRCLE
            </Txt>
            <Txt variant="heroDisplay" color={v7Text.primary} style={styles.amount}>
              {fmt(schedule.payoutAmount)}
            </Txt>
            <Txt variant="caption" color={v7Text.secondary}>
              {schedule.payoutDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {'  ·  '}{payoutLabel}
            </Txt>
          </View>
          {onConfigure && (
            <Pressable
              onPress={onConfigure}
              hitSlop={16}
              style={({ pressed }) => [styles.cfgBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Settings2 size={15} color={v7Text.primary} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: v7Surface.hairline }]} />

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Txt variant="microBold" color={v7Text.tertiary} style={styles.metaLabel}>MONTHLY</Txt>
            <Txt variant="bodyMdBold" color={v7Text.primary}>{fmt(cfg.monthlyPayment, { compact: true })}</Txt>
          </View>
          <View style={styles.metaItem}>
            <Txt variant="microBold" color={v7Text.tertiary} style={styles.metaLabel}>POSITION</Txt>
            <Txt variant="bodyMdBold" color={v7Text.primary}>#{cfg.myPosition} of {cfg.groupSize}</Txt>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: v7Surface.hairline,
  },
  content: {
    padding: space.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eyebrow: {
    textTransform: 'uppercase',
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
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, marginVertical: space.md },
  meta: {
    flexDirection: 'row',
    gap: 22,
  },
  metaItem: { flex: 0 },
  metaLabel: { letterSpacing: 1.4, marginBottom: 3 },
});
