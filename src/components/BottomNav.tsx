import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

type TabName = 'home' | 'learn' | 'ai-tutor' | 'profile';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: TabName; label: string; icon: IoniconName; activeIcon: IoniconName; href: string }[] = [
  { name: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', href: '/' },
  { name: 'learn', label: 'Learn', icon: 'book-outline', activeIcon: 'book', href: '/learn' },
  { name: 'ai-tutor', label: 'AI Tutor', icon: 'sparkles-outline', activeIcon: 'sparkles', href: '/ai-tutor' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', href: '/profile' },
];

const NAVBAR_HEIGHT = 72;
const FAB_SIZE = 56;
const FAB_RADIUS = FAB_SIZE / 2;
const NOTCH_RADIUS = 34;
const NOTCH_DEPTH = 22;
const CORNER_RADIUS = 22;
const FAB_OVERLAP = 18;

function buildNotchPath(width: number): string {
  const h = NAVBAR_HEIGHT;
  const cx = width / 2;
  const nr = NOTCH_RADIUS;
  const nd = NOTCH_DEPTH;
  const cr = CORNER_RADIUS;
  const flatStart = cx - nr - 28;
  const flatEnd = cx + nr + 28;

  return [
    `M 0 ${h}`,
    `L 0 ${cr}`,
    `Q 0 0 ${cr} 0`,
    `L ${flatStart} 0`,
    `C ${flatStart + 12} 0, ${cx - nr} ${nd * 0.3}, ${cx - nr} ${nd}`,
    `C ${cx - nr} ${nd + 8}, ${cx - 8} ${nd + 14}, ${cx} ${nd + 14}`,
    `C ${cx + 8} ${nd + 14}, ${cx + nr} ${nd + 8}, ${cx + nr} ${nd}`,
    `C ${cx + nr} ${nd * 0.3}, ${flatEnd - 12} 0, ${flatEnd} 0`,
    `L ${width - cr} 0`,
    `Q ${width} 0 ${width} ${cr}`,
    `L ${width} ${h}`,
    `Z`,
  ].join(' ');
}

interface BottomNavProps {
  activeTab?: TabName;
  onCenterPress?: () => void;
}

export default function BottomNav({ activeTab, onCenterPress }: BottomNavProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const notchPath = buildNotchPath(screenWidth);

  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  return (
    <View style={{ height: NAVBAR_HEIGHT + FAB_OVERLAP }}>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: NAVBAR_HEIGHT }}>
        <Svg width={screenWidth} height={NAVBAR_HEIGHT} viewBox={`0 0 ${screenWidth} ${NAVBAR_HEIGHT}`}>
          <Path d={notchPath} fill={colors.surface} />
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: colors.border,
          }}
        />
      </View>

      {onCenterPress && (
        <View
          style={{
            position: 'absolute',
            bottom: NAVBAR_HEIGHT - FAB_RADIUS - FAB_OVERLAP + 4,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 10,
          }}
          pointerEvents="box-none"
        >
          <TouchableOpacity onPress={onCenterPress} activeOpacity={0.85}>
            <View
              style={{
                width: FAB_SIZE,
                height: FAB_SIZE,
                borderRadius: FAB_RADIUS,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              <Ionicons name="add" size={28} color={colors.surface} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: NAVBAR_HEIGHT,
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingBottom: 10,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {leftTabs.map((tab) => {
            const isActive = tab.name === activeTab;
            return (
              <Link key={tab.name} href={tab.href} asChild>
                <TouchableOpacity style={{ alignItems: 'center', minWidth: 60 }}>
                  <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={24} color={isActive ? colors.primary : colors.textTertiary} />
                  <Text style={{ color: isActive ? colors.primary : colors.textTertiary, fontSize: 11, marginTop: 2, fontWeight: isActive ? '600' : '400' }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              </Link>
            );
          })}
        </View>

        <View style={{ width: FAB_SIZE + 16 }} />

        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {rightTabs.map((tab) => {
            const isActive = tab.name === activeTab;
            return (
              <Link key={tab.name} href={tab.href} asChild>
                <TouchableOpacity style={{ alignItems: 'center', minWidth: 60 }}>
                  <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={24} color={isActive ? colors.primary : colors.textTertiary} />
                  <Text style={{ color: isActive ? colors.primary : colors.textTertiary, fontSize: 11, marginTop: 2, fontWeight: isActive ? '600' : '400' }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              </Link>
            );
          })}
        </View>
      </View>
    </View>
  );
}
