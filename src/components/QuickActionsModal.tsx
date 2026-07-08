import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const QuickActionsModal = ({ visible, onClose }: Props) => {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      cardAnims.forEach(anim => anim.setValue(0));

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
        ...cardAnims.map((anim, i) =>
          Animated.spring(anim, {
            toValue: 1,
            delay: 200 + i * 100,
            damping: 20,
            stiffness: 150,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const actions = [
    {
      label: 'Practice Speaking',
      icon: 'account-voice',
      iconLib: 'material',
      bg: '#F5E6E6',
      color: colors.primary,
      route: '/echo-practice'
    },
    {
      label: 'Quick Review',
      icon: 'file-document-edit',
      iconLib: 'material',
      bg: '#FFF4E0',
      color: '#B45309',
      route: '/flashcards/greetings'
    },
    {
      label: 'Ask Aama',
      icon: 'head-cog',
      iconLib: 'material',
      bg: '#E8F5E9',
      color: colors.successDark,
      route: '/ai-tutor'
    },
    {
      label: 'Daily Challenge',
      icon: 'medal',
      iconLib: 'material',
      bg: '#F5E6E6',
      color: colors.primary,
      route: '/quiz/greetings'
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none">
      <View className="flex-1">
        {/* Backdrop */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
        </Animated.View>

        {/* Drawer */}
        <Animated.View 
          style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View
            style={{
              backgroundColor: '#F5F2ED',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              minHeight: SCREEN_HEIGHT * 0.6,
            }}
            className="px-6 pb-10 pt-6"
          >
            {/* Handle */}
            <View className="w-12 h-1.5 rounded-full self-center mb-8" style={{ backgroundColor: colors.border }} />

            {/* Title */}
            <Text
              className="text-brand text-3xl font-bold mb-16 text-center"
              style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}
            >
              Quick Actions
            </Text>
            
            {/* Grid */}
            <View className="flex-row flex-wrap justify-between mb-8 mt-4">
              {actions.map((action, i) => (
                <Animated.View
                  key={i}
                  style={{
                    opacity: cardAnims[i],
                    transform: [
                      { scale: cardAnims[i] },
                    ],
                  }}
                  className="w-[48%] mb-5"
                >
                  <TouchableOpacity
                    style={{ backgroundColor: colors.surface }}
                    className="p-5 rounded-3xl items-center shadow-sm"
                    onPress={() => { handleClose(); router.push(action.route as any); }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{ backgroundColor: action.bg }}
                      className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                    >
                      {action.iconLib === 'material' ? (
                        <MaterialCommunityIcons name={action.icon as any} size={26} color={action.color} />
                      ) : (
                        <Ionicons name={action.icon as any} size={26} color={action.color} />
                      )}
                    </View>
                    <Text className="text-sm font-semibold text-center" style={{ color: '#1F2937' }}>{action.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Close Button */}
            <View className="items-center mt-4">
              <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                <View
                  style={{
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                  className="w-16 h-16 rounded-full items-center justify-center shadow-lg"
                >
                  <Ionicons name="close" size={32} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={{ color: colors.textSecondary }} className="text-sm font-medium mt-3">Close</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
