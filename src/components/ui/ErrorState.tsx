import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Check your connection and try again.',
  onRetry,
  style,
}: ErrorStateProps) {
  return (
    <View style={[{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }, style]}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
      <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700', marginBottom: 4, textAlign: 'center' }}>
        {title}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
        {message}
      </Text>
      {onRetry ? <Button title="Retry" onPress={onRetry} size="sm" /> : null}
    </View>
  );
}
