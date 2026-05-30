import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import BottomNav from '../src/components/BottomNav';

const Settings = () => {
  const router = useRouter();

  return (
    <View className="flex-1" style={{ backgroundColor: '#FBF9F4' }}>
      <View className="px-5 pt-12 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-[#800816] text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-[#4A1942] text-xl font-bold">Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16 }} className="overflow-hidden mb-6">
          <TouchableOpacity className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}>
            <Text className="text-[#4A1942] text-base">Text-to-Speech Speed</Text>
            <Text className="text-[#6B7280] text-base">Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}>
            <Text className="text-[#4A1942] text-base">Notifications</Text>
            <Text className="text-[#6B7280] text-base">Enabled</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-4 flex-row justify-between items-center">
            <Text className="text-[#4A1942] text-base">Daily Reminder</Text>
            <Text className="text-[#6B7280] text-base">9:00 AM</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16 }} className="overflow-hidden mb-6">
          <TouchableOpacity className="px-4 py-4 flex-row justify-between items-center border-b" style={{ borderColor: '#E5E7EB' }}>
            <Text className="text-[#4A1942] text-base">Clear Learned Words</Text>
            <Text className="text-[#DC2626] text-base">Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity className="px-4 py-4 flex-row justify-between items-center">
            <Text className="text-[#4A1942] text-base">Account</Text>
            <Text className="text-[#6B7280] text-base">Manage</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
};

export default Settings;
