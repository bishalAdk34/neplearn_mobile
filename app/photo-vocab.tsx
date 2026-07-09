import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/auth';
import { useVocabStore, vocab, GUEST_ID } from '../src/data/vocab';
import { identifyObjects, isOffline, type IdentifiedObject } from '../src/services/ai';
import { speak } from '../src/services/tts';
import { useNetworkState } from '../src/hooks/useNetworkState';
import { ScreenHeader } from '../src/components/ui';
import { colors, shadows } from '../src/theme';
import { hapticLight, hapticSuccess } from '../src/utils/haptics';

const PhotoVocab = () => {
  const user = useAuthStore(s => s.user);
  const uid = user?.id || GUEST_ID;
  const { learnWord, isLearned } = useVocabStore();
  const { isOffline: networkOffline } = useNetworkState();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [objects, setObjects] = useState<IdentifiedObject[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]?.base64) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setObjects(null);
    setError(null);

    if (isOffline()) {
      setError('You are offline. Photo vocab needs an internet connection.');
      return;
    }

    setLoading(true);
    const identified = await identifyObjects(asset.base64!);
    setLoading(false);
    if (!identified) {
      setError('Could not identify objects in this photo. Try another one.');
      return;
    }
    setObjects(identified);
  };

  const pickImage = async () => {
    hapticLight();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });
    await analyze(result);
  };

  const takePhoto = async () => {
    hapticLight();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Camera permission is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
    });
    await analyze(result);
  };

  // Match an identified english label to known vocab (to enable "mark learned").
  const matchVocab = (english: string) =>
    vocab.find(w => w.english.toLowerCase() === english.toLowerCase().trim());

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="Photo Vocab" backIcon="back" />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="px-5">
          <Text style={{ color: colors.textSecondary }} className="text-base mb-4">
            Snap or pick a photo — Aama names what she sees in Nepali.
          </Text>

          {networkOffline && (
            <View style={{ backgroundColor: colors.warmSurface, borderRadius: 12 }} className="p-3 mb-4">
              <Text style={{ color: colors.warmInk }} className="text-sm text-center">
                You're offline. Photo vocab needs an internet connection.
              </Text>
            </View>
          )}

          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, borderRadius: 16, flex: 1, opacity: networkOffline ? 0.5 : 1 }}
              className="py-4 items-center flex-row justify-center"
              onPress={takePhoto}
              disabled={networkOffline || loading}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-base ml-2">Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, flex: 1, opacity: networkOffline ? 0.5 : 1 }}
              className="py-4 items-center flex-row justify-center"
              onPress={pickImage}
              disabled={networkOffline || loading}
            >
              <Ionicons name="images" size={20} color={colors.primary} />
              <Text className="font-bold text-base ml-2" style={{ color: colors.primary }}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16 }}
              className="mb-5"
              resizeMode="cover"
            />
          )}

          {loading && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textSecondary }} className="text-sm mt-3">Aama is looking at your photo...</Text>
            </View>
          )}

          {error && (
            <View style={{ backgroundColor: '#FEE2E2', borderRadius: 12 }} className="p-4 mb-4">
              <Text style={{ color: colors.danger }} className="text-sm text-center">{error}</Text>
            </View>
          )}

          {objects && objects.map((obj, i) => {
            const known = matchVocab(obj.english);
            const learned = known ? isLearned(uid, known.id) : false;
            return (
              <View
                key={i}
                style={{ backgroundColor: colors.surface, borderRadius: 16, ...shadows.card }}
                className="p-4 mb-3 flex-row items-center"
              >
                <View className="flex-1">
                  <Text className="text-ink text-base font-bold">{obj.english}</Text>
                  <Text className="text-brand text-xl">{obj.nepali}</Text>
                  <Text style={{ color: colors.textTertiary }} className="text-sm">{obj.roman}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => speak(obj.nepali, 'ne-NP').catch(() => speak(obj.roman, 'en-US'))}
                  className="mr-2"
                >
                  <View style={{ backgroundColor: '#FEE2E2' }} className="w-10 h-10 rounded-full items-center justify-center">
                    <Text>🔊</Text>
                  </View>
                </TouchableOpacity>
                {known && (
                  <TouchableOpacity
                    onPress={() => {
                      if (!learned) {
                        hapticSuccess();
                        learnWord(uid, known.id);
                      }
                    }}
                    disabled={learned}
                  >
                    <View
                      style={{ backgroundColor: learned ? '#D1FAE5' : colors.mutedSurface }}
                      className="px-3 py-2 rounded-full"
                    >
                      <Text style={{ color: learned ? colors.successDark : colors.textSecondary }} className="text-xs font-bold">
                        {learned ? '✓ Learned' : '+ Learn'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default PhotoVocab;
