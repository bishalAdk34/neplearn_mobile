import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { Link } from 'expo-router';

const themes = ['All Themes', 'Mystical Legends', 'Mountain', 'Festivals', 'Food', 'Daily Life'];

const Learn = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTheme, setActiveTheme] = useState('All Themes');

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="px-5 pt-12 pb-4">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5D5D0' }} className="flex-row items-center px-4 py-3">
            <Text className="text-[#9CA3AF] text-base mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-[#4A1942] text-base"
              placeholder="Search legends, festivals, food..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity className="ml-2">
              <Text className="text-[#800816] text-base">⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Card */}
        <View className="px-5 mb-6">
          <View style={{ borderRadius: 20, overflow: 'hidden' }}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800' }}
              className="w-full h-48"
              resizeMode="cover"
            />
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} className="absolute inset-0 px-5 py-6 justify-between">
              <View>
                <View style={{ backgroundColor: '#F59E0B' }} className="self-start px-3 py-1 rounded-full mb-3">
                  <Text className="text-white text-xs font-bold">FEATURED</Text>
                </View>
                <Text className="text-white text-xl font-bold mb-2">Discover the Heart of the Himalayas</Text>
                <Text className="text-white/80 text-sm">Stories, culture, and the living breath of Nepal.</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: '#FFFFFF' }} className="py-3 rounded-xl items-center mt-4">
                <Text className="text-[#800816] font-bold text-base">Start Exploring</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Browse by Theme */}
        <View className="px-5 mb-4">
          <Text className="text-[#4A1942] text-base font-semibold mb-3">Browse by Theme</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-5 px-5">
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme}
                style={{
                  backgroundColor: activeTheme === theme ? '#800816' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: activeTheme === theme ? '#800816' : '#E5D5D0',
                }}
                className="px-4 py-2 rounded-full mr-2"
                onPress={() => setActiveTheme(theme)}
              >
                <Text style={{ color: activeTheme === theme ? '#FFFFFF' : '#4A1942' }} className="text-sm font-semibold">
                  {theme}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Nepali Folklore Card */}
        <View className="px-5 mb-4">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' }}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=600' }}
              className="w-full h-40"
              resizeMode="cover"
            />
            <View className="p-4">
              <Text className="text-[#F59E0B] text-xs font-bold mb-1">NEPALI FOLKLORE</Text>
              <Text className="text-[#4A1942] text-lg font-bold mb-2">The Legend of the Yeti</Text>
              <Text className="text-[#6B7280] text-sm mb-3">Venture into the high altitudes where myth meets reality. Learn the ancient vocabulary of mountain dwellers.</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row">
                  <View style={{ backgroundColor: '#D1FAE5' }} className="px-2 py-1 rounded-full mr-2">
                    <Text className="text-[#065F46] text-xs font-semibold">A1</Text>
                  </View>
                  <View style={{ backgroundColor: '#FEE2E2' }} className="px-2 py-1 rounded-full">
                    <Text className="text-[#991B1B] text-xs font-semibold">B2</Text>
                  </View>
                </View>
                <TouchableOpacity style={{ backgroundColor: '#800816' }} className="px-4 py-2 rounded-xl">
                  <Text className="text-white text-sm font-semibold">Read Story</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Dashain Greetings Card */}
        <View className="px-5 mb-4">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20 }} className="p-4">
            <View className="flex-row items-center mb-3">
              <View style={{ backgroundColor: '#FEE2E2' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                <Text className="text-lg">🪔</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[#4A1942] text-lg font-bold">Dashain Greetings</Text>
              </View>
            </View>
            <Text className="text-[#6B7280] text-sm mb-4">Master the essential phrases for Nepal's biggest festival and learn to receive blessings.</Text>
            <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12 }} className="p-3 mb-4">
              <View className="flex-row items-center mb-2">
                <Text className="text-[#800816] mr-2">🔊</Text>
                <Text className="text-[#4A1942] text-sm font-semibold">Vijaya Dashami ko Shuvakamana!</Text>
              </View>
              <Text className="text-[#6B7280] text-xs ml-6">Happy Vijaya Dashami!</Text>
            </View>
            <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#800816' }} className="py-3 rounded-xl items-center">
              <Text className="text-[#800816] font-bold text-base">Practice Phrases</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ordering Momo Card */}
        <View className="px-5 mb-6">
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden' }}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600' }}
              className="w-full h-48"
              resizeMode="cover"
            />
            <View className="absolute bottom-3 left-3">
              <View style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} className="px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">CONVERSATION</Text>
              </View>
            </View>
            <View className="p-4">
              <Text className="text-[#4A1942] text-lg font-bold mb-1">Ordering Momo</Text>
              <Text className="text-[#6B7280] text-sm italic mb-4">"Ek plate buff momo paau na?"</Text>
              <TouchableOpacity style={{ backgroundColor: '#800816' }} className="py-3 rounded-xl items-center flex-row justify-center">
                <Text className="text-white text-base font-semibold mr-2"></Text>
                <Text className="text-white text-base font-semibold">Start Simulation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quote Section */}
        <View className="px-8 py-6 items-center">
          <Text className="text-[#D4D4D8] text-4xl mb-4">❝</Text>
          <Text className="text-[#4A1942] text-base text-center italic leading-6 mb-4">
            "Learning a language is not just about words; it's about seeing the world through a different pair of eyes."
          </Text>
          <Text className="text-[#800816] text-sm font-semibold">— HIMALAYAN WISDOM</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ backgroundColor: '#FBF9F4', borderTopWidth: 1, borderTopColor: '#E5D5D0' }} className="flex-row items-center px-4 pb-6 pt-3">
        <View className="flex-1 items-center">
          <Link href="/" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl">🏠</Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">Home</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-[#800816] text-xl">🔍</Text>
          <Text className="text-[#800816] text-xs mt-1 font-semibold">Explore</Text>
        </View>
        <View className="flex-1 items-center">
          <Link href="/ai-tutor" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl">🤖</Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">AI Tutor</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View className="flex-1 items-center">
          <Link href="/profile" asChild>
            <TouchableOpacity className="items-center">
              <Text className="text-[#9CA3AF] text-xl">👤</Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">Profile</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
};

export default Learn;
