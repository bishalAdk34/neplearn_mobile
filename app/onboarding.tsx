import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useVocabStore, type LearningGoal, type LearningLevel } from '../src/data/vocab';
import { colors } from '../src/theme';

const GOALS: { id: LearningGoal; label: string; icon: string }[] = [
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'culture', label: 'Culture', icon: '🏛️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍' },
];

const LEVELS: { id: LearningLevel; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'I\'m just starting with "Namaste"' },
  { id: 'intermediate', label: 'Intermediate', desc: 'I can hold basic conversations' },
  { id: 'advanced', label: 'Advanced', desc: 'I want to master formal Nepali' },
];

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

export default function Onboarding() {
  const router = useRouter();
  const { setLearningGoal, setLearningLevel, completeOnboarding } = useVocabStore();
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [level, setLevel] = useState<LearningLevel | null>(null);

  const handleStart = () => {
    if (goal) setLearningGoal(goal);
    if (level) setLearningLevel(level);
    completeOnboarding();
    router.replace('/');
  };

  const canStart = goal !== null && level !== null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Mountain Image */}
        <FadeIn delay={100}>
          <View className="px-6 pt-16 pb-4">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80' }}
              style={{ width: '100%', height: 220, borderRadius: 24 }}
              resizeMode="cover"
            />
          </View>
        </FadeIn>

        {/* Title */}
        <FadeIn delay={200}>
          <View className="px-8 mt-4">
            <Text style={{ fontFamily: 'serif', fontSize: 32, fontWeight: '600', color: colors.ink, textAlign: 'center' }}>
              Namaste, Traveler
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 24 }}>
              Begin your journey into the heart of Nepal through its beautiful language.
            </Text>
          </View>
        </FadeIn>

        {/* Learning Goal */}
        <FadeIn delay={300}>
          <View className="px-8 mt-8">
            <View className="flex-row items-center mb-4">
              <Text style={{ fontSize: 14 }}>🇳🇵</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Choose Your Learning Goal
              </Text>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {GOALS.map((g) => {
                const isSelected = goal === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setGoal(g.id)}
                    style={{
                      width: '48%',
                      padding: 16,
                      borderRadius: 16,
                      backgroundColor: isSelected ? colors.warmSurface : colors.surface,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ fontSize: 24, marginBottom: 6 }}>{g.icon}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: isSelected ? colors.primary : colors.ink }}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </FadeIn>

        {/* Level Selection */}
        <FadeIn delay={400}>
          <View className="px-8 mt-8">
            <View className="flex-row items-center mb-4">
              <Text style={{ fontSize: 14 }}>📊</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Select Your Level
              </Text>
            </View>
            {LEVELS.map((l) => {
              const isSelected = level === l.id;
              return (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => setLevel(l.id)}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>
                      {l.label}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                      {l.desc}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeIn>

        {/* Start Button */}
        <FadeIn delay={500}>
          <View className="px-8 mt-8">
            <TouchableOpacity
              onPress={handleStart}
              disabled={!canStart}
              style={{
                paddingVertical: 18,
                borderRadius: 32,
                backgroundColor: canStart ? colors.primary : colors.disabled,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: canStart ? 0.2 : 0.05,
                shadowRadius: 8,
                elevation: canStart ? 4 : 1,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.5 }}>
                Start Learning →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.replace('/signin')}
              className="mt-4 items-center"
            >
              <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '500' }}>
                I already have an account
              </Text>
            </TouchableOpacity>
          </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
}
