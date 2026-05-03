import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { space } from '../theme';
import { Txt } from './Txt';

interface Props {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionLabel({ title, action }: Props) {
  const { theme } = useTheme();
  return (
    <View style={styles.wrap}>
      <Txt variant="headingSm" color={theme.ink}>{title}</Txt>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={6}>
          <Txt variant="bodySmMed" color={theme.ink} style={{ textDecorationLine: 'underline' }}>
            {action.label}
          </Txt>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
    marginTop: space.xs,
  },
});
