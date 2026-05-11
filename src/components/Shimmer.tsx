import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated placeholder bar — slides a light "sheen" left → right across a
 * muted base. Matches the design's Shimmer (1.4s ease-in-out loop).
 */
export function Shimmer({ width = '100%', height = 14, borderRadius = 8, style }: Props) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-160, 200] });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#E9ECF3',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ translateX }], backgroundColor: '#F4F6FB', opacity: 0.9, width: 120 },
        ]}
      />
    </View>
  );
}
