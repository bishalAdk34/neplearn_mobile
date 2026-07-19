import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { ScreenHeader, ProgressBar } from '../src/components/ui';
import { colors, shadows } from '../src/theme';
import { stories, Story, LEVEL_LABELS } from '../src/data/stories';
import { speak } from '../src/services/tts';
import { hapticLight, hapticSuccess, hapticError } from '../src/utils/haptics';
import { GUEST_ID } from '../src/data/vocab';
import Confetti from '../src/components/Confetti';
import { useAuthStore } from '../src/stores/auth';
import { awardXp } from '../src/services/xp';

type Mode = 'list' | 'read' | 'quiz' | 'done';

const StoryScreen = () => {
  const [mode, setMode] = useState<Mode>('list');
  const [story, setStory] = useState<Story | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const openStory = (s: Story) => {
    hapticLight();
    setStory(s);
    setQuestionIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setMode('read');
  };

  const handleSelect = (index: number) => {
    if (answered || !story) return;
    const correct = index === story.questions[questionIndex].answerIndex;
    setSelected(index);
    setAnswered(true);
    if (correct) {
      setScore(prev => prev + 1);
      hapticSuccess();
    } else {
      hapticError();
    }
  };

  const handleNextQuestion = () => {
    if (!story) return;
    if (questionIndex + 1 >= story.questions.length) {
      const uid = useAuthStore.getState().user?.id || GUEST_ID;
      awardXp(uid, 20, 'quiz');
      setMode('done');
    } else {
      setQuestionIndex(prev => prev + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  // ---- Story list (picker) ----
  if (mode === 'list' || !story) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <ScreenHeader title="Stories" backIcon="back" />
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View className="px-5">
            <Text style={{ color: colors.textSecondary }} className="text-base mb-5">
              Read short stories in Nepali with romanization and translation, then test your understanding.
            </Text>
            {stories.map(s => (
              <TouchableOpacity
                key={s.id}
                style={{ backgroundColor: colors.surface, borderRadius: 20, ...shadows.card }}
                className="p-5 mb-4 flex-row items-center"
                onPress={() => openStory(s)}
              >
                <Text className="text-4xl mr-4">{s.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-brand text-xs font-bold mb-1">{s.tag}</Text>
                  <Text className="text-ink text-lg font-bold mb-1">{s.title}</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm mb-2">{s.nepaliTitle}</Text>
                  <View className="flex-row items-center">
                    <View style={{ backgroundColor: colors.mutedSurface }} className="px-2 py-0.5 rounded-full mr-2">
                      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">{LEVEL_LABELS[s.level]}</Text>
                    </View>
                    <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
                    <Text style={{ color: colors.textTertiary }} className="text-xs ml-1">{s.minutes} min</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <BottomNav activeTab="learn" />
      </View>
    );
  }

  // ---- Completion ----
  if (mode === 'done') {
    return (
      <View className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
        <Confetti active={true} />
        <Text className="text-6xl mb-4">📖</Text>
        <Text className="text-ink text-2xl font-bold mb-2">Story Complete!</Text>
        <Text style={{ color: colors.textSecondary }} className="text-base mb-6 text-center">
          You got {score} of {story.questions.length} questions right.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 12 }}
          className="px-8 py-4 w-full items-center"
          onPress={() => setMode('list')}
        >
          <Text className="text-white font-bold text-lg">Back to Stories</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- Comprehension quiz ----
  if (mode === 'quiz') {
    const q = story.questions[questionIndex];
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <ScreenHeader
          title="Check Understanding"
          backIcon="close"
          centered
          right={
            <View style={{ backgroundColor: colors.warmSurface }} className="px-3 py-1 rounded-full">
              <Text style={{ color: colors.warmInk }} className="text-sm font-bold">{questionIndex + 1}/{story.questions.length}</Text>
            </View>
          }
        />
        <View className="px-5 mb-6">
          <ProgressBar progress={questionIndex / story.questions.length} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <View className="px-5">
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, ...shadows.card }} className="p-6 mb-6">
              <Text className="text-ink text-xl font-bold text-center">{q.question}</Text>
            </View>

            {q.options.map((option, index) => {
              let borderColor: string = colors.border;
              let bgColor: string = colors.surface;
              if (answered) {
                if (index === q.answerIndex) {
                  borderColor = colors.success;
                  bgColor = '#D1FAE5';
                } else if (index === selected) {
                  borderColor = colors.danger;
                  bgColor = '#FEE2E2';
                }
              }
              return (
                <TouchableOpacity
                  key={index}
                  style={{ backgroundColor: bgColor, borderWidth: 2, borderColor, borderRadius: 16 }}
                  className="p-4 mb-3"
                  onPress={() => handleSelect(index)}
                  disabled={answered}
                >
                  <Text className="text-ink text-base font-semibold">{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {answered && (
          <View className="px-5 pb-8 pt-4" style={{ backgroundColor: colors.background }}>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary }}
              className="py-4 rounded-xl items-center"
              onPress={handleNextQuestion}
            >
              <Text className="text-white font-bold text-base">
                {questionIndex + 1 >= story.questions.length ? 'Finish' : 'Next Question'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ---- Reader ----
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title={story.title} backIcon="back" onBack={() => setMode('list')} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="px-5">
          {/* Title block */}
          <View className="mb-6">
            <View style={{ backgroundColor: '#FEE2E2' }} className="self-start px-3 py-1 rounded-full mb-3">
              <Text className="text-brand text-xs font-bold">{story.tag}</Text>
            </View>
            <Text className="text-ink text-3xl font-bold mb-1">{story.nepaliTitle}</Text>
            <Text style={{ color: colors.textSecondary }} className="text-base mb-2">{story.title}</Text>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary }} className="text-sm ml-1">
                {story.minutes} min read • {LEVEL_LABELS[story.level]}
              </Text>
            </View>
          </View>

          {/* Paragraphs */}
          {story.paragraphs.map((p, index) => (
            <View key={index} style={{ backgroundColor: colors.surface, borderRadius: 16, ...shadows.card }} className="p-5 mb-4">
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-ink text-lg leading-8 font-semibold flex-1 mr-3">{p.nepali}</Text>
                <TouchableOpacity
                  style={{ backgroundColor: colors.mutedSurface }}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  onPress={() => {
                    hapticLight();
                    speak(p.nepali, 'ne-NP');
                  }}
                >
                  <Ionicons name="volume-high" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.textSecondary }} className="text-sm italic mb-2">{p.roman}</Text>
              <Text style={{ color: colors.textSecondary }} className="text-base leading-6">{p.english}</Text>
            </View>
          ))}

          {/* Cultural insight */}
          {story.insight && (
            <View style={{ backgroundColor: colors.successDark, borderRadius: 20 }} className="p-5 mb-6">
              <View className="flex-row items-center mb-3">
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="w-8 h-8 rounded-full items-center justify-center mr-3">
                  <Ionicons name="bulb" size={18} color="#FFFFFF" />
                </View>
                <Text className="text-xs font-bold tracking-wider" style={{ color: '#D1FAE5' }}>CULTURAL INSIGHT</Text>
              </View>
              <Text className="text-white text-lg font-bold mb-2">{story.insight.title}</Text>
              <Text className="text-sm leading-6" style={{ color: '#D1FAE5' }}>{story.insight.text}</Text>
            </View>
          )}

          {/* Quiz CTA */}
          <TouchableOpacity
            style={{ backgroundColor: colors.primary }}
            className="py-4 rounded-xl items-center flex-row justify-center mb-3"
            onPress={() => {
              hapticLight();
              setMode('quiz');
            }}
          >
            <Text className="text-white text-base font-bold mr-2">Check Understanding</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            className="py-4 rounded-xl items-center mb-6"
            onPress={() => setMode('list')}
          >
            <Text className="text-ink text-base font-semibold">Back to Stories</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default StoryScreen;
