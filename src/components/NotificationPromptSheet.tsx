import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, Platform, Animated, Dimensions, PanResponder } from 'react-native';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  onEnable: () => void;
  onNotNow: () => void;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NotificationPromptSheet({ visible, onEnable, onNotNow }: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleNotNow = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onNotNow());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
          fadeAnim.setValue(Math.max(0, 1 - gestureState.dy / 300));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          handleNotNow();
        } else {
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 0,
              damping: 25,
              stiffness: 200,
              useNativeDriver: true,
            }),
            Animated.spring(fadeAnim, {
              toValue: 1,
              damping: 25,
              stiffness: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleEnable = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onEnable());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleNotNow}>
      <View className="flex-1">
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <Pressable className="flex-1 bg-black/40" onPress={handleNotNow} />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: slideAnim }],
          }}
          {...panResponder.panHandlers}
        >
          <View
            style={{
              backgroundColor: '#F5F2ED',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            }}
            className="px-6 pt-4 pb-10"
          >
            <View className="w-12 h-1.5 rounded-full self-center mb-6" style={{ backgroundColor: colors.border }} />

            <Text className="text-center mb-4" style={{ fontSize: 48 }}>🔔</Text>

            <Text
              className="text-center mb-3"
              style={{
                fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                fontSize: 24,
                fontWeight: '700',
                color: colors.ink,
              }}
            >
              Keep your streak alive!
            </Text>

            <Text
              className="text-center mb-8"
              style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, paddingHorizontal: 4 }}
            >
              Get daily reminders to practice Nepali, maintain your streak, and never miss a lesson.
            </Text>

            <View className="mb-8" style={{ gap: 14 }}>
              <FeatureRow icon="📅" text="Daily practice reminders" />
              <FeatureRow icon="🔥" text="Protect your streak" />
              <FeatureRow icon="🏆" text="Achievement notifications" />
            </View>

            <TouchableOpacity
              style={{ backgroundColor: colors.primary, borderRadius: 16 }}
              className="py-4 items-center mb-3"
              onPress={handleEnable}
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-lg">Enable reminders</Text>
            </TouchableOpacity>

            <TouchableOpacity className="py-3 items-center" onPress={handleNotNow} activeOpacity={0.7}>
              <Text style={{ color: colors.textSecondary }} className="text-base font-medium">Not now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center">
      <View
        style={{ backgroundColor: colors.surface, borderRadius: 12 }}
        className="w-11 h-11 items-center justify-center mr-4"
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text className="text-base flex-1" style={{ color: '#1F2937', fontWeight: '500' }}>{text}</Text>
    </View>
  );
}
