import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { useTheme } from '../ThemeContext';
import { radius, space } from '../theme';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  variant?: 'base' | 'feature' | 'recommendation' | 'flat' | 'glass';
}

/**
 * Minimal card — solid white on white canvas, solid #141416 on dark canvas.
 * Border: gray (#E5E7EB) in light, white 10% in dark.
 */
export function Card({ children, style, padding, variant = 'base' }: Props) {
  const { theme } = useTheme();

  const isStandardCard = variant === 'base' || variant === 'glass' || variant === 'recommendation';

  if (isStandardCard) {
    const r = variant === 'recommendation' ? radius.xl : radius.xxxl;
    const p = padding ?? (variant === 'recommendation' ? space.lg : space.xl);

    return (
      <View
        style={[
          styles.card,
          {
            borderRadius: r,
            padding: p,
            backgroundColor: '#FFFFFF',
            borderColor: theme.border,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  const variants: Record<string, ViewStyle> = {
    feature: {
      backgroundColor: theme.bgSubtle,
      borderRadius: radius.xl,
      padding: padding ?? space.xxl,
    },
    flat: {
      borderRadius: radius.lg,
      padding: padding ?? 0,
    },
  };

  return <View style={[variants[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
