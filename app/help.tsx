import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme';
import { ScreenHeader } from '../src/components/ui';

const faqs = [
  {
    q: 'How do I start learning?',
    a: 'Pick any category from the home screen and start with flashcards. Once you\'re comfortable, take the quiz to lock in your knowledge.',
  },
  {
    q: 'What is Echo Practice?',
    a: 'Echo Practice plays a Nepali phrase and you repeat it back. The app listens and gives feedback on your pronunciation.',
  },
  {
    q: 'How does the AI Tutor work?',
    a: 'The AI Tutor ("Aama") is a conversational partner you can practice Nepali with. Ask questions, try sentences, and get real-time corrections.',
  },
  {
    q: 'How is XP calculated?',
    a: 'You earn 20 XP per correct lesson answer, 15 XP per correct quiz answer, 25 XP for saving a journal entry, and 30 XP for completing Echo Practice.',
  },
  {
    q: 'What happens to my streak?',
    a: 'Your streak grows by one day each day you earn any XP. If you miss a day it resets. Stay consistent to build your streak!',
  },
  {
    q: 'Can I use the app offline?',
    a: 'Yes! Most features work offline. Your progress is saved locally and syncs to the cloud when you reconnect.',
  },
  {
    q: 'How do I reset my progress?',
    a: 'Go to Settings and tap "Clear Learned Words". This resets all learned words locally and in the cloud.',
  },
];

const guides = [
  {
    icon: 'book-outline',
    title: 'Flashcards',
    description: 'Swipe through words, tap to hear pronunciation, and mark them as learned.',
  },
  {
    icon: 'help-circle-outline',
    title: 'Quizzes',
    description: 'Test yourself with multiple-choice questions. Each quiz caps at 10 questions per session.',
  },
  {
    icon: 'mic-outline',
    title: 'Echo Practice',
    description: 'Listen to native pronunciation, record yourself, and compare.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'AI Tutor',
    description: 'Have natural conversations with Aama to practice real-world Nepali.',
  },
];

const Help = () => {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Help" backIcon="back" />

        {/* Hero */}
        <View className="mx-5 mb-8 rounded-2xl overflow-hidden" style={{ height: 160 }}>
          <View style={{ backgroundColor: '#4A1942', flex: 1, justifyContent: 'center', padding: 24 }}>
            <Text className="text-white text-2xl font-bold mb-2" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
              How can we help?
            </Text>
            <Text className="text-white/70 text-sm leading-5">
              Everything you need to make the most of your Nepali learning journey.
            </Text>
          </View>
        </View>

        {/* Quick Guides */}
        <View className="px-5 mb-8">
          <Text className="text-ink text-lg font-bold mb-4" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
            Getting Started
          </Text>
          {guides.map((guide, i) => (
            <View
              key={i}
              className="bg-white mb-3 p-4 rounded-2xl flex-row items-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
            >
              <View className="w-11 h-11 rounded-full items-center justify-center mr-4" style={{ backgroundColor: '#F5F0EB' }}>
                <Ionicons name={guide.icon as any} size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold mb-1" style={{ color: '#1F2937' }}>{guide.title}</Text>
                <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>{guide.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* FAQs */}
        <View className="px-5 mb-8">
          <Text className="text-ink text-lg font-bold mb-4" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
            Frequently Asked Questions
          </Text>
          <View className="bg-white overflow-hidden" style={{ borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 }}>
            {faqs.map((faq, i) => {
              const isOpen = expandedIndex === i;
              return (
                <TouchableOpacity
                  key={i}
                  className="px-5"
                  style={{ borderBottomWidth: i < faqs.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
                  onPress={() => setExpandedIndex(isOpen ? null : i)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-between py-4">
                    <Text className="text-base flex-1 pr-2" style={{ color: '#1F2937', fontWeight: isOpen ? '700' : '500' }}>
                      {faq.q}
                    </Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>
                  {isOpen && (
                    <Text className="text-sm pb-4 leading-5" style={{ color: colors.textSecondary }}>
                      {faq.a}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Still need help */}
        <View className="mx-5 mb-8 bg-white p-6 rounded-2xl items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
          <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#F5F0EB' }}>
            <Ionicons name="headset-outline" size={22} color={colors.primary} />
          </View>
          <Text className="text-base font-bold mb-2" style={{ color: '#1F2937' }}>Still need help?</Text>
          <Text className="text-sm text-center mb-4 leading-5" style={{ color: colors.textSecondary }}>
            Can\'t find what you\'re looking for? Our support team is here to help.
          </Text>
          <TouchableOpacity
            className="bg-brand py-3 px-8 rounded-full"
            onPress={() => router.push('/support')}
          >
            <Text className="text-white font-semibold">Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Help;
