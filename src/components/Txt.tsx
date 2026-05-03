import { Text as RNText, TextProps, StyleProp, TextStyle } from 'react-native';
import { type } from '../theme';

type Variant = keyof typeof type;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Txt({ variant = 'bodyMd', color, style, ...rest }: Props) {
  const t = type[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: t.family,
          fontSize: t.size,
          letterSpacing: t.ls,
          lineHeight: t.size * t.lh,
          ...(color ? { color } : {}),
        },
        style,
      ]}
    />
  );
}
