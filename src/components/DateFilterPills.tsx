import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { radius, space } from '../theme';
import { Txt } from './Txt';

export type RangePreset = 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime' | 'custom';

interface Props {
  value: RangePreset;
  onChange: (next: RangePreset) => void;
}

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'thisYear',  label: 'This year'  },
  { id: 'allTime',   label: 'All time'   },
  { id: 'custom',    label: 'Custom'     },
];

export function DateFilterPills({ value, onChange }: Props) {
  const { theme } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, { paddingHorizontal: space.lg }]}
      style={{ marginHorizontal: -space.lg }}
    >
      {PRESETS.map(p => {
        const active = value === p.id;
        return (
          <Pressable
            key={p.id}
            onPress={() => onChange(p.id)}
            style={[
              styles.pill,
              {
                backgroundColor: active ? theme.ink : '#FFFFFF',
                borderColor: active ? theme.ink : theme.border,
              },
            ]}
          >
            <Txt variant="bodySmMed" color={active ? '#FFFFFF' : theme.ink}>
              {p.label}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
