import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GoogleLogo from '../src/components/GoogleLogo';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_CLIENT_ID, SUPABASE_URL } from '../src/config';
import { supabase } from '../src/services/supabase';
import { upsertProfile, syncLearnWord } from '../src/services/db';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, GUEST_ID } from '../src/data/vocab';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
      });
    } catch (e) {
      console.warn('GoogleSignin configure failed.', e);
    }
  }, []);

  const handleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken, user } = response.data;

        if (!idToken) {
          setError('No ID token returned from Google. Please try again.');
          setIsLoading(false);
          return;
        }

        const { data, error: sbError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (sbError) {
          console.error('supabase signInWithIdToken failed', {
            supabaseUrl: SUPABASE_URL,
            idTokenPresent: !!idToken,
            message: sbError.message,
          });
          setError(`Authentication failed: ${sbError.message}`);
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          const name = user.name || 'User';
          const email = user.email;
          const photo = user.photo || undefined;
          useAuthStore.getState().setUser({ id: data.user.id, name, email, photo });
          upsertProfile(data.user.id, name, email, photo);
          useVocabStore.getState().completeOnboarding();

          const vocabState = useVocabStore.getState();
          const guestWords = vocabState.learnedByUser[GUEST_ID] || [];
          if (guestWords.length > 0) {
            const existingUserWords = vocabState.learnedByUser[data.user.id] || [];
            const merged = [...new Set([...existingUserWords, ...guestWords])];
            useVocabStore.setState({
              learnedByUser: { ...vocabState.learnedByUser, [data.user.id]: merged },
            });
            for (const wordId of guestWords) {
              syncLearnWord(data.user.id, wordId);
            }
          }
        }

        router.replace('/');
      } else {
        setError('Sign-in was cancelled. Tap the button to try again.');
      }
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.IN_PROGRESS:
            setError('Sign in is already in progress.');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError('Google Play Services are not available on this device.');
            break;
          default:
            setError(`Sign in failed: ${err.message}`);
        }
      } else {
        setError(`An unknown error occurred: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goHome = () => {
    useVocabStore.getState().completeOnboarding();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <TouchableOpacity onPress={goHome} className="absolute top-16 left-6 p-2 z-10">
        <Ionicons name="arrow-back" size={24} color="#64748B" />
      </TouchableOpacity>

      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center mb-10">
          <View className="w-32 h-32 bg-indigo-100 rounded-2xl items-center justify-center mb-4 overflow-hidden">
            <Image source={require('../assets/icon.png')} className="w-full h-full" resizeMode="contain" />
          </View>
          <Text className="text-3xl font-bold text-[#4F46E5] tracking-wide">NepLearn</Text>
          <Text className="text-sm text-[#64748B] mt-1">Learn Nepali, one word at a time</Text>
        </View>

        <View className="items-center mb-8">
          <Text className="text-xl font-bold text-[#0F172A] text-center">Sign in to save progress</Text>
          <Text className="text-sm text-[#64748B] text-center mt-1">
            Your progress will be synced to your account
          </Text>
        </View>

        {error && (
          <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' }} className="px-4 py-3 mb-6 w-full">
            <Text className="text-[#DC2626] text-sm text-center">{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={isLoading}
          className="flex-row bg-white border border-[#E2E8F0] py-4 px-8 rounded-2xl items-center justify-center w-full"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, opacity: isLoading ? 0.6 : 1 }}
        >
        {isLoading ? (
          <ActivityIndicator size="small" color="#4285F4" style={{ marginRight: 10 }} />
        ) : (
          <GoogleLogo size={22} />
        )}
        <Text className="text-lg font-semibold text-[#0F172A] ml-2">
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goHome} className="mt-6">
          <Text className="text-sm text-[#94A3B8]">Continue without signing in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
