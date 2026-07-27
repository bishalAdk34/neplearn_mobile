import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { QuickActionsModal } from './QuickActionsModal';

type TabName = 'home' | 'learn' | 'ai-tutor' | 'profile';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: TabName; label: string; icon: IoniconName; activeIcon: IoniconName; href: string }[] = [
  { name: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', href: '/' },
  { name: 'learn', label: 'Learn', icon: 'book-outline', activeIcon: 'book', href: '/learn' },
  { name: 'ai-tutor', label: 'AI Tutor', icon: 'sparkles-outline', activeIcon: 'sparkles', href: '/ai-tutor' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', href: '/profile' },
];

export default function BottomNav({ activeTab }: { activeTab?: TabName }) {
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  return (
    <View style={{ position: 'relative' }}>
      <View
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        }}
        className="flex-row items-center justify-center px-4 py-4"
      >
        {TABS.map(tab => {
          const isActive = tab.name === activeTab;

          if (isActive) {
            return (
              <View key={tab.name} className="flex-1 items-center">
                <Ionicons name={tab.activeIcon} size={24} color={colors.primary} />
                <Text className="text-brand text-xs mt-1 font-semibold">{tab.label}</Text>
              </View>
            );
          }

          return (
            <Link key={tab.name} href={tab.href} asChild>
              <TouchableOpacity className="flex-1 items-center">
                <Ionicons name={tab.icon} size={24} color={colors.textTertiary} />
                <Text style={{ color: colors.textTertiary }} className="text-xs mt-1">{tab.label}</Text>
              </TouchableOpacity>
            </Link>
          );
        })}
      </View>

      <View style={{ position: 'absolute', top: -24, left: 0, right: 0, alignItems: 'center' }} pointerEvents="box-none">
        <TouchableOpacity onPress={() => setQuickActionsVisible(true)}>
          <View
            className="bg-brand w-14 h-14 rounded-full items-center justify-center"
            style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
          >
            <Ionicons name="add" size={28} color={colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <QuickActionsModal visible={quickActionsVisible} onClose={() => setQuickActionsVisible(false)} />
    </View>
  );
}
