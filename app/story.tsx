import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';

const Story = () => {
  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View className="w-full h-64 mb-6">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800' }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} className="absolute inset-0" />
        </View>

        {/* Content Container */}
        <View className="px-5 -mt-10" style={{ backgroundColor: '#FBF9F4', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          {/* Tag & Title */}
          <View className="mb-4">
            <View style={{ backgroundColor: '#FEE2E2' }} className="self-start px-3 py-1 rounded-full mb-3">
              <Text className="text-[#800816] text-xs font-bold">FOLKLORE</Text>
            </View>
            <Text className="text-[#4A1942] text-3xl font-bold mb-2">The Legend of the Yeti</Text>
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text className="text-[#6B7280] text-sm ml-1">10 min read • Level A2</Text>
            </View>
          </View>

          {/* Audio Player */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }} className="flex-row items-center p-4 mb-6">
            <TouchableOpacity style={{ backgroundColor: '#800816' }} className="w-10 h-10 rounded-full items-center justify-center mr-4">
              <Ionicons name="play" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-[#4A1942] text-sm font-semibold mb-1">Listen to this Legend (Nepali)</Text>
              <View style={{ backgroundColor: '#F3F4F6' }} className="h-1.5 rounded-full overflow-hidden">
                <View style={{ width: '30%', backgroundColor: '#800816' }} className="h-full rounded-full" />
              </View>
            </View>
            <Text className="text-[#6B7280] text-xs ml-3">03:42</Text>
          </View>

          {/* Story Text */}
          <Text className="text-[#4A1942] text-base leading-7 mb-6">
            High above the clouds, where the air grows thin and the wind whispers through the crags of Mount Everest, lives a creature spoken of in hushed tones around the warmth of a yak-butter fire. He is known as the <Text className="text-[#800816] font-bold underline">Him-manav</Text>.
          </Text>

          <Text className="text-[#4A1942] text-base leading-7 mb-6">
            To the Sherpa people of the Khumbu region, the Yeti is not merely a myth but a guardian of the high passes. It is said to be a bipedal giant, covered in thick reddish-brown hair, roaming the vast <Text className="text-[#800816] font-bold underline">Himal</Text> during the quiet hours of the night.
          </Text>

          {/* Cultural Insight */}
          <View style={{ backgroundColor: '#064E3B', borderRadius: 20 }} className="p-5 mb-6">
            <View className="flex-row items-center mb-3">
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="w-8 h-8 rounded-full items-center justify-center mr-3">
                <Ionicons name="bulb" size={18} color="#FFFFFF" />
              </View>
              <Text className="text-[#D1FAE5] text-xs font-bold tracking-wider">CULTURAL INSIGHT</Text>
            </View>
            <Text className="text-white text-lg font-bold mb-2">The Guardian of the Pass</Text>
            <Text className="text-[#D1FAE5] text-sm leading-6">
              In Sherpa tradition, seeing a Yeti is considered a powerful spiritual omen. Many monasteries in the region, such as Khumjung, even claim to possess relics like Yeti scalps, preserving a deep reverence for these mountain spirits.
            </Text>
          </View>

          {/* More Text */}
          <Text className="text-[#4A1942] text-base leading-7 mb-6">
            Tales of the Yeti describe his feet as being backwards—a clever trick to confuse anyone attempting to track it. If you find a trail leading toward the peaks, it may actually be descending into the valley. This dual nature mirrors the mountains themselves: beautiful, but dangerous to those who do not respect the silence of the <Text className="text-[#800816] font-bold underline">Sagarmatha</Text>.
          </Text>

          {/* Footer Actions */}
          <View className="mb-6">
            <TouchableOpacity style={{ backgroundColor: '#800816' }} className="py-4 rounded-xl items-center flex-row justify-center mb-3">
              <Text className="text-white text-base font-bold mr-2">Next Chapter: The Tracks in Khumjung</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D5D0' }} className="py-4 rounded-xl items-center">
              <Text className="text-[#4A1942] text-base font-semibold">Back to Folklore Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav activeTab="learn" />
    </View>
  );
};

export default Story;
