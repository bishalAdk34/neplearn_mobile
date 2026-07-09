import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { GUEST_ID } from '../src/data/vocab';
import { sendMessage, type ChatMessage } from '../src/services/ai';
import { awardXp } from '../src/services/xp';
import { scenarios, type Scenario } from '../src/data/scenarios';
import { useNetworkState } from '../src/hooks/useNetworkState';
import { TypingDots, MessageBubble } from '../src/components/ChatView';
import { ScreenHeader } from '../src/components/ui';
import { colors, shadows } from '../src/theme';
import { hapticLight } from '../src/utils/haptics';

// XP after this many user messages in a session (once per session).
const XP_EXCHANGES = 3;

const Roleplay = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const { isOffline: networkOffline } = useNetworkState();
  const scrollRef = useRef<ScrollView>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const userTurnsRef = useRef(0);
  const xpAwardedRef = useRef(false);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const startScenario = (s: Scenario) => {
    hapticLight();
    setScenario(s);
    userTurnsRef.current = 0;
    xpAwardedRef.current = false;
    setMessages([{ id: 'open', role: 'assistant', text: s.openingLine }]);
  };

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !scenario) return;
    const msg = text.trim();
    setInputText('');
    setIsLoading(true);

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: msg }]);

    const chatHistory: ChatMessage[] = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      text: m.text,
    }));

    // Ephemeral session: no chat_history writes.
    const reply = await sendMessage(chatHistory, msg, scenario.contextPrompt);
    setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: reply }]);

    userTurnsRef.current += 1;
    if (!xpAwardedRef.current && userTurnsRef.current >= XP_EXCHANGES) {
      xpAwardedRef.current = true;
      awardXp(uid, 20, 'ai_tutor');
    }

    setIsLoading(false);
  }, [messages, isLoading, scenario, uid]);

  // ---- Scenario picker ----
  if (!scenario) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <ScreenHeader title="Roleplay" backIcon="back" />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="px-5">
            <Text style={{ color: colors.textSecondary }} className="text-base mb-2">
              Practice real conversations with Aama playing a role. Earn 20 XP per session.
            </Text>
            {networkOffline && (
              <View style={{ backgroundColor: colors.warmSurface, borderRadius: 12 }} className="p-3 mb-3">
                <Text style={{ color: colors.warmInk }} className="text-sm text-center">
                  Roleplay needs an internet connection.
                </Text>
              </View>
            )}
            <View className="mt-3">
              {scenarios.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={{ backgroundColor: colors.surface, borderRadius: 20, opacity: networkOffline ? 0.5 : 1, ...shadows.card }}
                  className="p-5 mb-4 flex-row items-center"
                  onPress={() => startScenario(s)}
                  disabled={networkOffline}
                >
                  <Text className="text-4xl mr-4">{s.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-ink text-lg font-bold mb-1">{s.title}</Text>
                    <Text style={{ color: colors.textSecondary }} className="text-sm">{s.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---- Chat ----
  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScreenHeader
        title={`${scenario.emoji} ${scenario.title}`}
        backIcon="close"
        onBack={() => setScenario(null)}
        right={
          networkOffline ? (
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.danger }} />
          ) : undefined
        }
      />

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => <MessageBubble key={msg.id} role={msg.role} text={msg.text} />)}
        {isLoading && <TypingDots />}
      </ScrollView>

      <View
        className="flex-row items-center px-4 py-3 mb-6"
        style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border }}
      >
        <TextInput
          className="flex-1 h-11 px-4 rounded-full text-base"
          style={{ backgroundColor: colors.mutedSurface, color: colors.ink }}
          placeholder="Reply in Nepali..."
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
    </KeyboardAvoidingView>
  );
};

export default Roleplay;
