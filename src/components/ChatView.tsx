import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { colors } from '../theme';

/** Animated three-dot "typing" indicator shared by AI chat screens. */
export const TypingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      );

    const parallel = Animated.parallel([anim(dot1, 0), anim(dot2, 200), anim(dot3, 400)]);
    parallel.start();
    return () => parallel.stop();
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 3,
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
  });

  return (
    <View className="flex-row items-center px-4 py-3">
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
};

/** Chat bubble shared by AI chat screens (Aama avatar for assistant). */
export const MessageBubble = ({ role, text }: { role: 'user' | 'assistant'; text: string }) => {
  const isUser = role === 'user';
  return (
    <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      {!isUser && (
        <View className="w-8 h-8 rounded-full items-center justify-center mr-2 mt-1" style={{ backgroundColor: colors.border }}>
          <Text className="text-sm">👩</Text>
        </View>
      )}
      <View
        className={`max-w-[80%] px-4 py-3 ${isUser ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}
        style={{
          backgroundColor: isUser ? colors.primary : colors.surface,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border,
        }}
      >
        <Text className={`text-base leading-6 ${isUser ? 'text-white' : 'text-ink'}`}>{text}</Text>
      </View>
    </View>
  );
};
