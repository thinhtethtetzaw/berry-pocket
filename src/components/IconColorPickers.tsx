import { View, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { v7Text, v7Surface } from '../theme';
import { Icon } from './Icon';
import { Txt } from './Txt';

// Curated icon set — covers most personal-finance categories.
export const ICON_OPTIONS = [
  'Home', 'Heart', 'ShoppingBag', 'Utensils', 'Coffee', 'Car',
  'Plane', 'Bus', 'Train', 'Bike', 'Fuel', 'Wrench',
  'Briefcase', 'GraduationCap', 'BookOpen', 'Gift', 'PartyPopper', 'Music',
  'Tv', 'Gamepad2', 'Dumbbell', 'Activity', 'Stethoscope', 'Pill',
  'Sparkles', 'Star', 'Zap', 'Phone', 'Wifi', 'Smartphone',
  'CreditCard', 'Wallet', 'PiggyBank', 'TrendingUp', 'TrendingDown', 'DollarSign',
  'Users', 'User', 'Baby', 'Dog', 'Cat', 'TreePine',
  'Shirt', 'Camera', 'Plug', 'Lightbulb', 'Cloud', 'Sun',
];

// Curated color palette — calm, distinct, friendly.
export const COLOR_OPTIONS = [
  '#E66A4A', // muted coral (v13 danger)
  '#E0814A', // deeper peach
  '#F4B400', // amber
  '#3FA67A', // green
  '#1BA673', // emerald
  '#3B9EFF', // sky
  '#1456F0', // blue
  '#5B7FE0', // cobalt
  '#A855F7', // purple
  '#EA5EC1', // magenta
  '#64748B', // slate
  '#0E1220', // ink
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  accent?: string;
}

export function IconPicker({ value, onChange, accent = '#0E1220' }: IconPickerProps) {
  return (
    <View style={styles.iconGrid}>
      {ICON_OPTIONS.map((name) => {
        const active = name === value;
        return (
          <Pressable
            key={name}
            onPress={() => onChange(name)}
            style={[
              styles.iconCell,
              active && { backgroundColor: accent, borderColor: accent },
            ]}
          >
            <Icon
              name={name}
              size={18}
              color={active ? '#FFFFFF' : v7Text.primary}
              strokeWidth={2}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.colorGrid}>
      {COLOR_OPTIONS.map((c) => {
        const active = c === value;
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={[
              styles.colorCell,
              { backgroundColor: c },
              active && styles.colorCellActive,
            ]}
          >
            {active && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Lighten a hex color to use as a soft pastel tint. */
export function pastelFrom(hex: string): string {
  // Mix with white to ~90% white
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.85);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

const styles = StyleSheet.create({
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconCell: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: v7Surface.plainCard,
    borderWidth: 1,
    borderColor: v7Surface.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCellActive: {
    borderColor: '#FFFFFF',
    shadowColor: '#141E3C',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
});
