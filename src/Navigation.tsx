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
import { fontWeight, palette } from './theme';

const Tab = createBottomTabNavigator();

type IconName = 'Home' | 'Activity' | 'Statistics' | 'ROSCA' | 'Settings';

const ICON_MAP: Record<IconName, typeof Home> = {
  Home,
  Activity:   Receipt,
  Statistics: PieChart,
  ROSCA:      Users,
  Settings,
};

function AnimatedTabIcon({
  name,
  focused,
  color,
}: {
  name: IconName;
  focused: boolean;
  color: string;
}) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.18 : 1,
        useNativeDriver: true,
        tension: 280,
        friction: 14,
      }),
      Animated.timing(bgOpacity, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const IconComp = ICON_MAP[name];

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.iconBg,
          { backgroundColor: theme.bgSubtle, opacity: bgOpacity },
        ]}
      />
      <IconComp
        size={focused ? 19 : 18}
        color={color}
        strokeWidth={focused ? 2.5 : 1.8}
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
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            // v7 — floating frosted pill, detached from screen edges
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: Platform.OS === 'ios' ? 26 : 16,
            height: 64,
            paddingTop: 8,
            paddingBottom: 8,
            paddingHorizontal: 12,
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: 'rgba(20,30,60,0.07)',
            borderRadius: 26,
            // soft drop shadow
            shadowColor: '#141E3C',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 20,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: fontWeight.semibold,
            letterSpacing: 0.3,
            marginTop: 2,
          },
          tabBarActiveTintColor: theme.ink,
          tabBarInactiveTintColor: theme.steel,
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name={route.name as IconName}
              focused={focused}
              color={color}
            />
          ),
        })}
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
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    borderRadius: 14,
  },
});
