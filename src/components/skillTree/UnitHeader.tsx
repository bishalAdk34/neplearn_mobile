import React from 'react';
import { View, Text } from 'react-native';
import { Category, CATEGORY_META } from '../../data/vocab';
import { NodeStatus } from '../../data/skillTree';
import { colors } from '../../theme';

interface UnitHeaderProps {
  category: Category;
  status: NodeStatus;
  learned: number;
  total: number;
}

export default function UnitHeader({ category, status, learned, total }: UnitHeaderProps) {
  const meta = CATEGORY_META[category];
  const locked = status === 'locked';

  return (
    <View
      style={{
        backgroundColor: locked ? colors.mutedSurface : meta.color,
        borderRadius: 20,
        opacity: locked ? 0.6 : 1,
      }}
      className="mx-5 mt-6 mb-4 px-5 py-4 flex-row items-center"
    >
      <Text className="text-3xl mr-3">{locked ? '🔒' : meta.emoji}</Text>
      <View className="flex-1">
        <Text
          style={{ color: locked ? colors.textSecondary : '#FFFFFF' }}
          className="text-lg font-bold capitalize"
        >
          {category}
        </Text>
        <Text
          style={{ color: locked ? colors.textTertiary : 'rgba(255,255,255,0.85)' }}
          className="text-xs font-semibold"
        >
          {locked ? 'Locked' : `${learned}/${total} words learned`}
        </Text>
      </View>
    </View>
  );
}
