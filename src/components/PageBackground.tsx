import { View, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';

/** Solid canvas — white in light mode, #0a0a0a in dark. */
export function PageBackground() {
  const { theme } = useTheme();
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]} />;
}
