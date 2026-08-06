import React, { useEffect } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { NodeStatus } from '../../data/skillTree';
import { colors } from '../../theme';

const NODE_SIZE = 64;

interface LessonNodeProps {
  x: number;
  y: number;
  label: number;
  status: NodeStatus;
  color: string;
  isNext: boolean;
  onPress: () => void;
}

export default function LessonNode({ x, y, label, status, color, isNext, onPress }: LessonNodeProps) {
  const scale = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) });
  }, []);

  useEffect(() => {
    if (isNext) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 650, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isNext]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const locked = status === 'locked';
  const completed = status === 'completed';
  const bgColor = locked ? colors.mutedSurface : completed ? colors.success : color;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - NODE_SIZE / 2,
          top: y - NODE_SIZE / 2,
          width: NODE_SIZE,
          height: NODE_SIZE,
        },
        animatedStyle,
      ]}
    >
      <TouchableOpacity
        disabled={locked}
        onPress={onPress}
        activeOpacity={0.8}
        style={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: NODE_SIZE / 2,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: locked ? 0.04 : 0.15,
          shadowRadius: 6,
          elevation: locked ? 1 : 4,
        }}
      >
        {locked ? (
          <Ionicons name="lock-closed" size={22} color={colors.textTertiary} />
        ) : completed ? (
          <Ionicons name="checkmark" size={28} color="#FFFFFF" />
        ) : (
          <Text style={{ color: '#FFFFFF' }} className="text-lg font-bold">{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
