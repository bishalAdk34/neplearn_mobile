import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/theme';
import { ScreenHeader } from '../src/components/ui';

const contactItems = [
  {
    icon: 'mail-outline',
    title: 'Email Us',
    description: 'support@neplearn.com',
    action: () => Linking.openURL('mailto:support@neplearn.com'),
  },
  {
    icon: 'globe-outline',
    title: 'Website',
    description: 'neplearn.com',
    action: () => Linking.openURL('https://neplearn.com'),
  },
];

const reportOptions = [
  {
    icon: 'bug-outline',
    title: 'Report a Bug',
    description: 'Something not working right? Let us know what happened.',
  },
  {
    icon: 'bulb-outline',
    title: 'Feature Request',
    description: 'Have an idea to make NepLearn better? We want to hear it.',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    title: 'General Feedback',
    description: 'Praise, suggestions, or anything else on your mind.',
  },
];

const Support = () => {
  const router = useRouter();

  const handleReport = (title: string) => {
    const subject = encodeURIComponent(`[NepLearn] ${title}`);
    const body = encodeURIComponent('\n\n---\nApp Version: 1.0.0\nPlatform: ' + Platform.OS);
    Linking.openURL(`mailto:support@neplearn.com?subject=${subject}&body=${body}`);
  };

  return (
    <View className="flex-1 bg-cream">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Support" backIcon="back" />

        {/* Hero */}
        <View className="mx-5 mb-8 rounded-2xl overflow-hidden" style={{ height: 160 }}>
          <View style={{ backgroundColor: '#800816', flex: 1, justifyContent: 'center', padding: 24 }}>
            <Text className="text-white text-2xl font-bold mb-2" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
              We're here to help
            </Text>
            <Text className="text-white/70 text-sm leading-5">
              Reach out to us and we'll get back to you as soon as possible.
            </Text>
          </View>
        </View>

        {/* Contact */}
        <View className="px-5 mb-8">
          <Text className="text-ink text-lg font-bold mb-4" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
            Contact Us
          </Text>
          {contactItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              className="bg-white mb-3 p-4 rounded-2xl flex-row items-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
              onPress={item.action}
            >
              <View className="w-11 h-11 rounded-full items-center justify-center mr-4" style={{ backgroundColor: '#F5F0EB' }}>
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold mb-1" style={{ color: '#1F2937' }}>{item.title}</Text>
                <Text className="text-sm" style={{ color: colors.primary }}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D4C4B7" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Report / Feedback */}
        <View className="px-5 mb-8">
          <Text className="text-ink text-lg font-bold mb-4" style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
            Feedback & Issues
          </Text>
          <View className="bg-white overflow-hidden" style={{ borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 }}>
            {reportOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                className="flex-row items-center px-5 py-4"
                style={{ borderBottomWidth: i < reportOptions.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
                onPress={() => handleReport(opt.title)}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#F5F0EB' }}>
                  <Ionicons name={opt.icon as any} size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold mb-1" style={{ color: '#1F2937' }}>{opt.title}</Text>
                  <Text className="text-sm leading-5" style={{ color: colors.textSecondary }}>{opt.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D4C4B7" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Response time */}
        <View className="mx-5 mb-8 bg-white p-6 rounded-2xl items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
          <View className="w-12 h-12 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#F5F0EB' }}>
            <Ionicons name="time-outline" size={22} color={colors.primary} />
          </View>
          <Text className="text-base font-bold mb-2" style={{ color: '#1F2937' }}>Response Time</Text>
          <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
            We typically respond within 24 hours during business days. For urgent issues, email us directly.
          </Text>
        </View>

        {/* Footer */}
        <View className="items-center py-4">
          <Text style={{ color: colors.textTertiary }} className="text-xs">NepLearn v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Support;
