import { View, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../ThemeContext';
import { radius, space } from '../theme';
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
        <Txt variant="microBold" color={theme.muted} style={styles.eyebrow}>
          BERRYPOCKET
        </Txt>
        <Txt variant="headingMd" color={theme.ink}>
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
    marginBottom: 4,
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
