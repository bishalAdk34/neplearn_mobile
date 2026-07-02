import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore } from '../src/data/vocab';
import { sendMessage, isOffline } from '../src/services/ai';
import { saveChatMessage, fetchChatHistory, addXp, updateStreak } from '../src/services/db';
import { useNetworkState } from '../src/hooks/useNetworkState';
import type { ChatMessage } from '../src/services/ai';

const QUICK_ACTIONS = [
  { label: 'Teach me greetings', icon: '👋' },
  { label: 'Explain sentence structure', icon: '📝' },
  { label: "How do I say 'thank you'?", icon: '🙏' },
  { label: 'Daily conversation practice', icon: '💬' },
];

const TypingDots = () => {
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
    backgroundColor: '#800816',
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

const AITutor = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isOffline: networkOffline } = useNetworkState();
  const learnedByUser = useVocabStore(s => s.learnedByUser);
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  const uid = user?.id || '__guest__';
  const learnedIds = learnedByUser[uid] || [];

  useEffect(() => {
    (async () => {
      const history = await fetchChatHistory(uid, 50);
      setMessages(
        history.map((m, i) => ({
          id: `${i}`,
          role: m.role as 'user' | 'assistant',
          text: m.content,
        }))
      );
      setHasLoaded(true);
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

    const learnedContext = learnedIds.length > 0
      ? `The user already knows these word IDs: ${learnedIds.join(', ')}`
      : undefined;

    const reply = await sendMessage(chatHistory, msg, learnedContext);

    const aiMsg = { id: `a-${Date.now()}`, role: 'assistant' as const, text: reply };
    setMessages(prev => [...prev, aiMsg]);
    await saveChatMessage(uid, 'assistant', reply);

    if (!xpAwarded && reply.length > 50) {
      addXp(uid, 5, 'ai_tutor');
      updateStreak(uid);
      setXpAwarded(true);
    }

    setIsLoading(false);
  }, [messages, isLoading, uid, xpAwarded, learnedIds]);

  const handleQuickAction = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  const MessageBubble = ({ role, text }: { role: 'user' | 'assistant'; text: string }) => {
    const isUser = role === 'user';
    return (
      <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
        {!isUser && (
          <View className="w-8 h-8 rounded-full items-center justify-center mr-2 mt-1" style={{ backgroundColor: '#E5D5D0' }}>
            <Text className="text-sm">👩</Text>
          </View>
        )}
        <View
          className={`max-w-[80%] px-4 py-3 ${isUser ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}
          style={{
            backgroundColor: isUser ? '#800816' : '#FFFFFF',
            borderWidth: isUser ? 0 : 1,
            borderColor: '#E5D5D0',
          }}
        >
          <Text className={`text-base leading-6 ${isUser ? 'text-white' : 'text-[#4A1942]'}`}>{text}</Text>
        </View>
      </View>
    );
  };

  if (!hasLoaded) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#FBF9F4' }}>
        <Text className="text-[#800816] text-lg">Loading Aama...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: '#FBF9F4' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#4A1942" />
          </TouchableOpacity>
          <View>
            <Text className="text-[#4A1942] text-lg font-bold">AI Tutor</Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: networkOffline ? '#EF4444' : '#10B981' }} />
              <Text className="text-xs" style={{ color: networkOffline ? '#EF4444' : '#10B981' }}>
                {networkOffline ? 'Offline' : 'Online'}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center">
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full mr-3"
            style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D5D0' }}
          >
            <Text className="mr-1">🔥</Text>
            <Text className="text-[#4A1942] text-sm font-bold">{learnedIds.length}</Text>
          </View>
        </View>
      </View>

      {networkOffline && (
        <View className="px-4 py-2" style={{ backgroundColor: '#FEF3C7' }}>
          <Text className="text-amber-800 text-sm text-center">
            You're offline. Changes sync when back online.
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View className="items-center px-5 pt-4">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#E5D5D0' }}>
              <Text className="text-3xl">👩</Text>
            </View>
            <Text className="text-[#4A1942] text-2xl font-bold mb-1">Aama</Text>
            <Text className="text-[#6B7280] text-sm mb-6">Native Speaker & Language Expert</Text>

            <View className="w-full mb-6 p-4 rounded-2xl rounded-bl-md" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D5D0' }}>
              <Text className="text-[#4A1942] text-base mb-2">
                Namaste! 🙏 I'm Aama, your Nepali language tutor. Tell me what you'd like to learn today, or try one of these:
              </Text>
            </View>

            <View className="w-full flex-row flex-wrap">
              {QUICK_ACTIONS.map(action => (
                <TouchableOpacity
                  key={action.label}
                  onPress={() => handleQuickAction(action.label)}
                  className="flex-row items-center mr-2 mb-2 px-4 py-3 rounded-full"
                  style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D5D0' }}
                >
                  <Text className="mr-2">{action.icon}</Text>
                  <Text className="text-[#4A1942] text-sm font-medium">{action.label}</Text>
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
        style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#E5D5D0' }}
      >
        <TextInput
          className="flex-1 h-11 px-4 rounded-full text-base"
          style={{ backgroundColor: '#F3F0EE', color: '#4A1942' }}
          placeholder="Ask Aama anything..."
          placeholderTextColor="#9CA3AF"
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
          style={{ backgroundColor: inputText.trim() && !isLoading && !networkOffline ? '#800816' : '#D4D4D8' }}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <BottomNav activeTab="ai-tutor" />
    </KeyboardAvoidingView>
  );
};

export default AITutor;
