import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Animated, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVocabStore, type LearningGoal, type LearningLevel } from '../src/data/vocab';
import { useSettingsStore } from '../src/stores/settings';
import { colors } from '../src/theme';
import { hapticSelection, hapticSuccess } from '../src/utils/haptics';

const GOALS: { id: LearningGoal; label: string; icon: string }[] = [
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'culture', label: 'Culture', icon: '🏛️' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍' },
];

const LEVELS: { id: LearningLevel; label: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', desc: 'I know a few words at most' },
  { id: 'intermediate', label: 'Intermediate', desc: 'I can have simple conversations' },
  { id: 'advanced', label: 'Advanced', desc: 'I am intermediate or higher' },
];

const DAILY_GOALS: { xp: number; label: string; desc: string; icon: string }[] = [
  { xp: 20, label: 'Casual', desc: '~5 min a day', icon: '🌱' },
  { xp: 50, label: 'Regular', desc: '~10 min a day', icon: '🔥' },
  { xp: 100, label: 'Intense', desc: '~20 min a day', icon: '⚡' },
];

const TOTAL_STEPS = 5;
const LOADING_STEP = 5;

const LOADING_MESSAGES = [
  'Analyzing your goals...',
  'Matching lessons to your level...',
  'Building your personalized path...',
  'Setting your daily pace...',
];
const LOADING_STEP_DURATION = 650;

function LoadingStep({ name, onDone }: { name: string; onDone: () => void }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, useNativeDriver: true })
    ).start();
    Animated.timing(progress, {
      toValue: 1,
      duration: LOADING_MESSAGES.length * LOADING_STEP_DURATION + 400,
      useNativeDriver: false,
    }).start();

    const timers = LOADING_MESSAGES.map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), (i + 1) * LOADING_STEP_DURATION)
    );
    const finishTimer = setTimeout(onDone, LOADING_MESSAGES.length * LOADING_STEP_DURATION + 500);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotateDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View className="px-8 flex-1 justify-center items-center">
      <Animated.View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          borderWidth: 4,
          borderColor: colors.primary,
          borderTopColor: 'transparent',
          transform: [{ rotate: rotateDeg }],
          marginBottom: 28,
        }}
      />
      <Text
        style={{
          fontFamily: 'serif',
          fontSize: 22,
          fontWeight: '600',
          color: colors.ink,
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        {name.trim() ? `Crafting ${name.trim()}'s path...` : 'Crafting your path...'}
      </Text>
      <View
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.border,
          overflow: 'hidden',
          marginBottom: 28,
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: colors.primary,
            width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>
      <View style={{ width: '100%' }}>
        {LOADING_MESSAGES.map((msg, i) => {
          const done = i < visibleCount;
          return (
            <View
              key={msg}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, opacity: done ? 1 : 0.3 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  marginRight: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? colors.primary : 'transparent',
                  borderWidth: done ? 0 : 1.5,
                  borderColor: colors.border,
                }}
              >
                {done && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: done ? colors.ink : colors.textTertiary,
                  fontWeight: done ? '600' : '400',
                }}
              >
                {msg}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ProgressDots({ step }: { step: number }) {
  return (
    <View className="flex-row justify-center" style={{ gap: 6 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === step ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= step ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { setLearningGoal, setLearningLevel, setUserName, completeOnboarding } = useVocabStore();
  const setDailyGoalXp = useSettingsStore(s => s.setDailyGoalXp);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [level, setLevel] = useState<LearningLevel | null>(null);
  const [dailyXp, setDailyXp] = useState<number | null>(null);

  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  const animateTo = (nextStep: number) => {
    const dir = nextStep > step ? 1 : -1;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -dir * 24, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      translateX.setValue(dir * 24);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) animateTo(step + 1);
  };
  const goBack = () => {
    if (step > 0) animateTo(step - 1);
  };

  const selectGoal = (g: LearningGoal) => {
    hapticSelection();
    setGoal(g);
    setTimeout(goNext, 250);
  };
  const selectLevel = (l: LearningLevel) => {
    hapticSelection();
    setLevel(l);
    setTimeout(goNext, 250);
  };
  const selectDailyXp = (xp: number) => {
    hapticSelection();
    setDailyXp(xp);
    setTimeout(goNext, 250);
  };

  const saveAnswers = () => {
    if (name.trim()) setUserName(name);
    if (goal) setLearningGoal(goal);
    if (level) setLearningLevel(level);
    if (dailyXp) setDailyGoalXp(dailyXp);
  };

  const startFinishing = () => {
    saveAnswers();
    animateTo(LOADING_STEP);
  };

  const handleFinish = () => {
    hapticSuccess();
    completeOnboarding();
    router.replace('/');
  };

  const goToSignIn = () => {
    saveAnswers();
    router.replace('/signin');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top bar: back + progress (hidden on final loading step) */}
      {step < TOTAL_STEPS && (
        <View className="px-6 pt-16 pb-4 flex-row items-center">
          <TouchableOpacity
            onPress={goBack}
            disabled={step === 0}
            style={{ width: 36, height: 36, opacity: step === 0 ? 0 : 1 }}
            className="items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <ProgressDots step={step} />
          </View>
          <View style={{ width: 36 }} />
        </View>
      )}

      <Animated.View style={{ flex: 1, opacity, transform: [{ translateX }] }}>
        {step === 0 && (
          <View className="px-8 flex-1 justify-center">
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>🙏</Text>
            <Text style={{ fontFamily: 'serif', fontSize: 30, fontWeight: '600', color: colors.ink, textAlign: 'center' }}>
              Namaste!
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 24 }}>
              What should we call you?
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={goNext}
              style={{
                marginTop: 28,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 20,
                fontSize: 18,
                color: colors.ink,
                backgroundColor: colors.surface,
                textAlign: 'center',
              }}
            />
            <TouchableOpacity
              onPress={goNext}
              style={{
                marginTop: 24,
                paddingVertical: 18,
                borderRadius: 32,
                backgroundColor: colors.primary,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF' }}>
                {name.trim() ? `Nice to meet you, ${name.trim()} →` : 'Continue →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View className="px-8 flex-1 justify-center">
            <View className="items-center mb-8">
              <Text style={{ fontSize: 14 }}>🇳🇵</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 8, textAlign: 'center' }}>
                Why are you learning Nepali?
              </Text>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {GOALS.map((g) => {
                const isSelected = goal === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => selectGoal(g.id)}
                    style={{
                      width: '48%',
                      padding: 18,
                      borderRadius: 16,
                      backgroundColor: isSelected ? colors.warmSurface : colors.surface,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>{g.icon}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: isSelected ? colors.primary : colors.ink }}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="px-8 flex-1 justify-center">
            <View className="items-center mb-8">
              <Text style={{ fontSize: 14 }}>📊</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 8, textAlign: 'center' }}>
                How much Nepali do you know?
              </Text>
            </View>
            {LEVELS.map((l) => {
              const isSelected = level === l.id;
              return (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => selectLevel(l.id)}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>{l.label}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{l.desc}</Text>
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
                    {isSelected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 3 && (
          <View className="px-8 flex-1 justify-center">
            <View className="items-center mb-8">
              <Text style={{ fontSize: 14 }}>🎯</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 8, textAlign: 'center' }}>
                Set your daily goal
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                You can change this later in Settings
              </Text>
            </View>
            {DAILY_GOALS.map((d) => {
              const isSelected = dailyXp === d.xp;
              return (
                <TouchableOpacity
                  key={d.xp}
                  onPress={() => selectDailyXp(d.xp)}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: isSelected ? colors.warmSurface : colors.surface,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 14 }}>{d.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}>{d.label}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{d.desc}</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>{d.xp} XP</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {step === 4 && (
          <View className="px-8 flex-1 justify-center">
            <Image
              source={require('../assets/splash_image.webp')}
              style={{ width: '100%', height: 380, borderRadius: 24, marginBottom: 24 }}
              resizeMode="cover"
            />
            <Text style={{ fontFamily: 'serif', fontSize: 28, fontWeight: '600', color: colors.ink, textAlign: 'center' }}>
              {name.trim() ? `You're all set, ${name.trim()}!` : "You're all set!"}
            </Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
              Your journey into the heart of Nepal starts now.
            </Text>
            <TouchableOpacity
              onPress={startFinishing}
              style={{
                marginTop: 32,
                paddingVertical: 18,
                borderRadius: 32,
                backgroundColor: colors.primary,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.5 }}>
                Start Learning →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToSignIn} className="mt-4 items-center">
              <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '500' }}>
                I already have an account
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === LOADING_STEP && <LoadingStep name={name} onDone={handleFinish} />}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
