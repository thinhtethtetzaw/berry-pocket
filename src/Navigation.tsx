import { useRef, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { Home, Receipt, PieChart, Users, Settings } from 'lucide-react-native';
import { HomeScreen } from './screens/HomeScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { StatisticsScreen } from './screens/StatisticsScreen';
import { RoscaScreen } from './screens/RoscaScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useTheme } from './ThemeContext';
import { fontWeight, v7Text, v7Surface, v7Accent, CATEGORY_BRAND } from './theme';

const Tab = createBottomTabNavigator();

type IconName = 'Home' | 'Activity' | 'Statistics' | 'ROSCA' | 'Settings';

const ICON_MAP: Record<IconName, typeof Home> = {
  Home,
  Activity:   Receipt,
  Statistics: PieChart,
  ROSCA:      Users,
  Settings,
};

// Per-tab accent color shown when the tab is active.
// Each one ties to its semantic identity:
//   Home       → ink (primary action surface)
//   Activity   → deeper peach (matches living / spending accent)
//   Statistics → lavender (analytics / fund accent)
//   ROSCA      → gold (matches ROSCA brand)
//   Settings   → slate (neutral utility)
const ACCENT: Record<IconName, string> = {
  Home:       v7Text.primary,
  Activity:   '#E0814A',
  Statistics: v7Accent.fund,
  ROSCA:      CATEGORY_BRAND.rosca.bg,
  Settings:   '#64748B',
};

function AnimatedTabIcon({
  name,
  focused,
}: {
  name: IconName;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.92)).current;
  const bgOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const accent = ACCENT[name];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1 : 0.92,
        useNativeDriver: true,
        tension: 280,
        friction: 14,
      }),
      Animated.timing(bgOpacity, {
        toValue: focused ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const IconComp = ICON_MAP[name];

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        { transform: [{ scale }] },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.iconBg,
          { backgroundColor: accent + '18', opacity: bgOpacity },
        ]}
      />
      <IconComp
        size={focused ? 21 : 19}
        color={focused ? accent : v7Text.tertiary}
        strokeWidth={focused ? 2.4 : 1.8}
      />
    </Animated.View>
  );
}

export function Navigation() {
  const { theme } = useTheme();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.bg,
      card: theme.bg,
      text: theme.ink,
      border: theme.border,
      primary: theme.ink,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const name = route.name as IconName;
          return {
            headerShown: false,
            tabBarShowLabel: true,
            // Docked tab bar — takes its own space, content doesn't bleed under.
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: v7Surface.hairline,
              height: Platform.OS === 'ios' ? 86 : 66,
              paddingTop: 10,
              paddingBottom: Platform.OS === 'ios' ? 28 : 10,
              paddingHorizontal: 6,
              // Soft top shadow so the bar feels lifted off the screen
              shadowColor: '#141E3C',
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: -2 },
              shadowRadius: 10,
              elevation: 12,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: fontWeight.semibold,
              letterSpacing: 0.2,
              marginTop: 4,
            },
            tabBarActiveTintColor: ACCENT[name],
            tabBarInactiveTintColor: v7Text.tertiary,
            tabBarIcon: ({ focused }) => (
              <AnimatedTabIcon name={name} focused={focused} />
            ),
          };
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Activity" component={TransactionsScreen} />
        <Tab.Screen name="Statistics" component={StatisticsScreen} />
        <Tab.Screen name="ROSCA" component={RoscaScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 46,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    borderRadius: 16,
  },
});
