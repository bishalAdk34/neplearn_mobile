import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme';
import { ScreenHeader } from '../src/components/ui';

const missionValues = [
  {
    icon: 'sparkles-outline',
    title: 'Cultural Preservation',
    description: 'Archiving ancestral knowledge through immersive digital storytelling.',
  },
  {
    icon: 'people-outline',
    title: 'Community Empowerment',
    description: 'Putting tools of creation into the hands of native practitioners.',
  },
  {
    icon: 'book-outline',
    title: 'Accessible Wisdom',
    description: 'Democratizing high-level cultural education for learners worldwide.',
  },
];

const stats = [
  { value: '320+', label: 'Words to Learn' },
  { value: '21', label: 'Categories' },
  { value: '100%', label: 'Free to Use' },
];

const About = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ScreenHeader title="About Us" backIcon="back" />

        {/* Hero Image */}
        <View className="mx-5 mb-8 rounded-2xl overflow-hidden" style={{ height: 220 }}>
          <View style={{ backgroundColor: '#2D3748', flex: 1, justifyContent: 'flex-end', padding: 24 }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(45,55,72,0.3)' }} />
            <Text className="text-white text-3xl font-bold leading-10" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }}>
              Preserving the Heart of the Himalayas
            </Text>
          </View>
        </View>

        {/* Our Story */}
        <View className="px-5 mb-10">
          <Text className="text-brand text-2xl font-bold mb-4" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Our Story</Text>
          <Text className="text-base leading-6 mb-4" style={{ lineHeight: 26, color: '#4A4A4A' }}>
            The Himalayan Academy was born from a singular vision amidst the clouds of Kathmandu: to bridge the gap between ancient Himalayan wisdom and the digital age. In a rapidly globalizing world, the delicate nuances of Nepali culture and its myriad dialects risk fading into silence.
          </Text>
          <Text className="text-base leading-6" style={{ lineHeight: 26, color: '#4A4A4A' }}>
            We believe that technology should be a vessel for preservation, not a catalyst for erasure. By merging modern pedagogical methods with deep-rooted cultural narratives, we empower the next generation to carry their heritage forward with pride and technical mastery.
          </Text>
        </View>

        {/* Mission & Values */}
        <View className="px-5 mb-10">
          <Text className="text-brand text-2xl font-bold mb-5" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Mission & Values</Text>
          {missionValues.map((item, index) => (
            <View
              key={index}
              className="bg-white mb-4 p-5 rounded-2xl items-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
            >
              <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#F5F0EB' }}>
                <Ionicons name={item.icon as any} size={22} color={colors.primary} />
              </View>
              <Text className="text-base font-bold mb-2 text-center" style={{ color: '#1F2937' }}>{item.title}</Text>
              <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>{item.description}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View className="bg-brand mx-5 mb-10 p-6 rounded-2xl">
          {stats.map((stat, index) => (
            <View key={index} className="items-center mb-4" style={{ marginBottom: index === stats.length - 1 ? 0 : 16 }}>
              <Text className="text-white text-3xl font-bold mb-1">{stat.value}</Text>
              <Text className="text-white/80 text-sm">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Join Button */}
        <View className="px-5 mb-8 items-center">
          <TouchableOpacity
            className="bg-brand py-4 px-10 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold text-base">Join the Journey</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center py-4">
          <Text style={{ color: colors.textTertiary }} className="text-xs">Built with ❤️ in Kathmandu</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default About;
