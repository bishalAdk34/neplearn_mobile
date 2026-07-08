import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface ScreenHeaderProps {
  title: string;
  /** 'back' arrow, 'close' X, or 'none' */
  backIcon?: 'back' | 'close' | 'none';
  onBack?: () => void;
  right?: React.ReactNode;
  /** Center title (used with close icon layouts) */
  centered?: boolean;
}

export default function ScreenHeader({
  title,
  backIcon = 'back',
  onBack,
  right,
  centered = false,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = onBack || (() => router.back());

  return (
    <View
      style={{ paddingTop: insets.top + 8 }}
      className="flex-row items-center justify-between px-5 pb-4"
    >
      <View className="flex-row items-center flex-1">
        {backIcon !== 'none' && (
          <TouchableOpacity onPress={handleBack} className="mr-4" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={backIcon === 'close' ? 'close' : 'arrow-back'}
              size={24}
              color={backIcon === 'close' ? colors.textSecondary : colors.primary}
            />
          </TouchableOpacity>
        )}
        {!centered && (
          <Text style={{ color: colors.ink }} className="text-xl font-bold" numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      {centered && (
        <Text style={{ color: colors.ink }} className="text-xl font-bold" numberOfLines={1}>
          {title}
        </Text>
      )}
      <View className="flex-1 flex-row justify-end items-center">{right}</View>
    </View>
  );
}
