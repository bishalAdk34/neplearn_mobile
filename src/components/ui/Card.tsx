import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, radii, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export default function Card({ children, style, padded = true }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          ...(padded ? { padding: 16 } : {}),
          ...shadows.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
