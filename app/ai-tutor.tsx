import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { QuickActionsModal } from '@/src/components/QuickActionsModal';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore } from '../src/data/vocab';
import { sendMessage, isOffline } from '../src/services/ai';
import { saveChatMessage, fetchChatHistory } from '../src/services/db';
import { awardXp } from '../src/services/xp';
import { GUEST_ID } from '../src/data/vocab';
import { buildLearnerProfileContext } from '../src/data/personalization';
import { useNetworkState } from '../src/hooks/useNetworkState';
import type { ChatMessage } from '../src/services/ai';
import { colors } from '../src/theme';
import { TypingDots, MessageBubble } from '../src/components/ChatView';

const QUICK_ACTIONS = [
  { label: 'Teach me greetings', icon: '👋' },
  { label: 'Explain sentence structure', icon: '📝' },
  { label: "How do I say 'thank you'?", icon: '🙏' },
  { label: 'Daily conversation practice', icon: '💬' },
];

const AITutor = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { isOffline: networkOffline } = useNetworkState();
  const learnedByUser = useVocabStore(s => s.learnedByUser);
  const learningGoal = useVocabStore(s => s.learningGoal);
  const learningLevel = useVocabStore(s => s.learningLevel);
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sessionXpRef = useRef(0);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  const uid = user?.id || GUEST_ID;
  const learnedIds = learnedByUser[uid] || [];

  useEffect(() => {
    (async () => {
      try {
        const history = await fetchChatHistory(uid, 50);
        setMessages(
          history.map((m, i) => ({
            id: `${i}`,
            role: m.role as 'user' | 'assistant',
            text: m.content,
          }))
        );
      } catch (e) {
        console.warn('Failed to load chat history:', e);
        setMessages([]);
      } finally {
        setHasLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const msg = text.trim();
    setInputText('');
    setIsLoading(true);

    const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, text: msg };
    setMessages(prev => [...prev, userMsg]);
    await saveChatMessage(uid, 'user', msg);

    const chatHistory: ChatMessage[] = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      text: m.text,
    }));

    const profileContext = buildLearnerProfileContext(learningGoal, learningLevel);
    const learnedContext = learnedIds.length > 0
      ? `The user already knows these word IDs: ${learnedIds.join(', ')}`
      : undefined;
    const context = [profileContext, learnedContext].filter(Boolean).join('\n') || undefined;

    const reply = await sendMessage(chatHistory, msg, context);

    const aiMsg = { id: `a-${Date.now()}`, role: 'assistant' as const, text: reply };
    setMessages(prev => [...prev, aiMsg]);
    await saveChatMessage(uid, 'assistant', reply);

    // 5 XP per user message, capped at 25 XP per session
    if (sessionXpRef.current < 25) {
      sessionXpRef.current += 5;
      awardXp(uid, 5, 'ai_tutor');
    }

    setIsLoading(false);
  }, [messages, isLoading, uid, learnedIds, learningGoal, learningLevel]);

  const handleQuickAction = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  if (!hasLoaded) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text className="text-brand text-lg">Loading Aama...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center justify-between px-5 pb-4"
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View>
            <Text className="text-ink text-lg font-bold">AI Tutor</Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: networkOffline ? colors.danger : colors.success }} />
              <Text className="text-xs" style={{ color: networkOffline ? colors.danger : colors.success }}>
                {networkOffline ? 'Offline' : 'Online'}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center">
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full mr-3"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <Text className="mr-1">🔥</Text>
            <Text className="text-ink text-sm font-bold">{learnedIds.length}</Text>
          </View>
        </View>
      </View>

      {networkOffline && (
        <View className="px-4 py-2" style={{ backgroundColor: colors.warmSurface }}>
          <Text style={{ color: colors.warmInk }} className="text-sm text-center">
            You're offline. Changes sync when back online.
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View className="items-center px-5 pt-4">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.border }}>
              <Text className="text-3xl">👩</Text>
            </View>
            <Text className="text-ink text-2xl font-bold mb-1">Aama</Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm mb-6">Native Speaker & Language Expert</Text>

            <View className="w-full mb-6 p-4 rounded-2xl rounded-bl-md" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-ink text-base mb-2">
                Namaste! 🙏 I'm Aama, your Nepali language tutor. Tell me what you'd like to learn today, or try one of these:
              </Text>
            </View>

            <View className="w-full flex-row flex-wrap">
              {QUICK_ACTIONS.map(action => (
                <TouchableOpacity
                  key={action.label}
                  onPress={() => handleQuickAction(action.label)}
                  className="flex-row items-center mr-2 mb-2 px-4 py-3 rounded-full"
                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                >
                  <Text className="mr-2">{action.icon}</Text>
                  <Text className="text-ink text-sm font-medium">{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} role={msg.role} text={msg.text} />)
        )}

        {isLoading && <TypingDots />}
      </ScrollView>

      <View
        className="flex-row items-center px-4 py-3"
        style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border }}
      >
        <TextInput
          className="flex-1 h-11 px-4 rounded-full text-base"
          style={{ backgroundColor: colors.mutedSurface, color: colors.ink }}
          placeholder="Ask Aama anything..."
          placeholderTextColor={colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend(inputText)}
          returnKeyType="send"
          editable={!isLoading}
        />
        <TouchableOpacity
          onPress={() => handleSend(inputText)}
          disabled={!inputText.trim() || isLoading || networkOffline}
          className="ml-3 w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: inputText.trim() && !isLoading && !networkOffline ? colors.primary : colors.disabled }}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View>
        <BottomNav activeTab="ai-tutor" />
        <View style={{ position: 'absolute', top: -24, left: 0, right: 0, alignItems: 'center' }} pointerEvents="box-none">
          <TouchableOpacity onPress={() => setQuickActionsVisible(true)}>
            <View style={{ backgroundColor: '#800816', shadowColor: '#800816', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }} className="w-14 h-14 rounded-full items-center justify-center">
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <QuickActionsModal visible={quickActionsVisible} onClose={() => setQuickActionsVisible(false)} />
    </KeyboardAvoidingView>
  );
};

export default AITutor;
