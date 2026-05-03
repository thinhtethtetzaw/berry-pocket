import { Pressable, View, StyleProp, ViewStyle, StyleSheet } from 'react-native';
import { ReactNode } from 'react';
import { useTheme } from '../ThemeContext';
import { palette, radius, type } from '../theme';
import { Txt } from './Txt';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  variant?: Variant;
  size?: Size;
  onPress?: () => void;
  disabled?: boolean;
  children?: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Pill({
  variant = 'primary',
  size = 'md',
  onPress,
  disabled,
  children,
  iconLeft,
  iconRight,
  style,
  fullWidth,
}: Props) {
  const { theme } = useTheme();

  const sizes = {
    sm: { px: 14, py: 7,  type: 'caption' as const },
    md: { px: 20, py: 10, type: 'buttonMd' as const },
    lg: { px: 28, py: 13, type: 'buttonMd' as const },
  };
  const s = sizes[size];

  const variants: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary:   { bg: theme.primary,  fg: theme.onPrimary, border: theme.primary },
    secondary: { bg: 'transparent',  fg: theme.ink,       border: theme.ink },
    tertiary:  { bg: theme.bg,       fg: theme.ink,       border: theme.border },
    ghost:     { bg: 'transparent',  fg: theme.ink,       border: 'transparent' },
  };
  const v = disabled
    ? { bg: theme.border, fg: theme.muted, border: theme.border }
    : variants[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          opacity: pressed ? 0.7 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {iconLeft ? <View style={{ marginRight: 6 }}>{iconLeft}</View> : null}
      {children ? (
        typeof children === 'string' ? (
          <Txt variant={s.type} color={v.fg}>{children}</Txt>
        ) : (
          children
        )
      ) : null}
      {iconRight ? <View style={{ marginLeft: 6 }}>{iconRight}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
