import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_CLIENT_ID } from '../src/config';
import { useAuthStore } from '../src/stores/auth';

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        fetchUserInfo(authentication.accessToken);
      }
    }
  }, [response]);

  const fetchUserInfo = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      useAuthStore.getState().setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        photo: data.picture,
      });
      router.replace('/');
    } catch {
      Alert.alert('Error', 'Failed to get user info. Try again.');
    }
  };

  const handleSignIn = () => {
    promptAsync();
  };

  const goHome = () => router.replace('/');

  return (
    <View className="flex-1 bg-[#F8FAFC] justify-center items-center px-8">
      <TouchableOpacity onPress={goHome} className="absolute top-16 left-6 p-2">
        <Text className="text-2xl text-[#64748B]">←</Text>
      </TouchableOpacity>

      <View className="items-center mb-4">
        <View className="w-20 h-20 bg-indigo-100 rounded-2xl items-center justify-center mb-4">
          <Text className="text-4xl">🇳🇵</Text>
        </View>
        <Text className="text-3xl font-bold text-[#4F46E5] tracking-wide">NepLearn</Text>
        <Text className="text-sm text-[#64748B] mt-1">Learn Nepali, one word at a time</Text>
      </View>

      <View className="w-full border-t border-[#E2E8F0] my-8" />

      <View className="items-center mb-8">
        <Text className="text-xl font-bold text-[#0F172A] text-center">Sign in to save progress</Text>
        <Text className="text-sm text-[#64748B] text-center mt-1">
          Your progress will be synced to your account
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleSignIn}
        disabled={!request}
        className="flex-row bg-white border border-[#E2E8F0] py-4 px-8 rounded-2xl items-center"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}
      >
        <Text className="text-xl font-bold text-[#4285F4] mr-3">G</Text>
        <Text className="text-lg font-semibold text-[#0F172A]">Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goHome} className="mt-6">
        <Text className="text-sm text-[#94A3B8]">Continue without signing in</Text>
      </TouchableOpacity>
    </View>
  );
}
