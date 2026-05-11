import { View, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';

/** Plain white canvas — no background decoration. */
export function PageBackground() {
  const { theme } = useTheme();
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]} />;
}
