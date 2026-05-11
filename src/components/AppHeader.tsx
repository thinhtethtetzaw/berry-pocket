import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { radius, space, v7Text } from '../theme';
import { MONTHS_SHORT } from '../lib/format';
import { Txt } from './Txt';

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  title?: string;
  showMonthNav?: boolean;
}

export function AppHeader({ year, month, onPrev, onNext, title, showMonthNav = true }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={{ flexShrink: 1 }}>
        <Txt variant="microBold" color={v7Text.tertiary} style={styles.eyebrow}>
          BERRYPOCKET
        </Txt>
        <Txt variant="headingMd" color={v7Text.primary} style={styles.title}>
          {title ?? `${MONTHS_SHORT[month]} ${year}`}
        </Txt>
      </View>

      {showMonthNav && (
        <View style={[styles.monthNav, { borderColor: theme.border }]}>
          <Pressable onPress={onPrev} style={styles.navBtn} hitSlop={6}>
            <ChevronLeft size={16} color={theme.ink} strokeWidth={2} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable onPress={onNext} style={styles.navBtn} hitSlop={6}>
            <ChevronRight size={16} color={theme.ink} strokeWidth={2} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: space.lg,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  title: {
    letterSpacing: -0.6,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.full,
    height: 36,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 16,
  },
});
