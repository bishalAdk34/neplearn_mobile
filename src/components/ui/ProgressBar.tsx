import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface ProgressBarProps {
  /** 0..1 */
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  height = 8,
  color = colors.primary,
  trackColor = colors.border,
  style,
}: ProgressBarProps) {
  const anim = useRef(new Animated.Value(Math.max(0, Math.min(1, progress)))).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}
