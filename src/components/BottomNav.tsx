import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type TabName = 'home' | 'learn' | 'ai-tutor' | 'profile';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: TabName; label: string; icon: IoniconName; activeIcon: IoniconName; href: string }[] = [
  { name: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', href: '/' },
  { name: 'learn', label: 'Learn', icon: 'book-outline', activeIcon: 'book', href: '/learn' },
  { name: 'ai-tutor', label: 'AI Tutor', icon: 'sparkles-outline', activeIcon: 'sparkles', href: '/ai-tutor' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', href: '/profile' },
];

export default function BottomNav({ activeTab }: { activeTab?: TabName }) {
  return (
    <View style={{ backgroundColor: '#FBF9F4', borderTopWidth: 1, borderTopColor: '#E5D5D0' }} className="flex-row items-center justify-center px-4 py-4">
      {TABS.map(tab => {
        const isActive = tab.name === activeTab;

        if (isActive) {
          return (
            <View key={tab.name} className="flex-1 items-center">
              <Ionicons name={tab.activeIcon} size={24} color="#800816" />
              <Text className="text-[#800816] text-xs mt-1 font-semibold">{tab.label}</Text>
            </View>
          );
        }

        return (
          <Link key={tab.name} href={tab.href} asChild>
            <TouchableOpacity className="flex-1 items-center">
              <Ionicons name={tab.icon} size={24} color="#9CA3AF" />
              <Text className="text-[#9CA3AF] text-xs mt-1">{tab.label}</Text>
            </TouchableOpacity>
          </Link>
        );
      })}
    </View>
  );
}
