import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { colors } from '../../theme';
import Button from './Button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export default function EmptyState({
  emoji = '🗒️',
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }, style]}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</Text>
      <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700', marginBottom: 4, textAlign: 'center' }}>
        {title}
      </Text>
      {message ? (
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} size="sm" /> : null}
    </View>
  );
}
