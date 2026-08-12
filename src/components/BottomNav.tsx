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
const FAB_SIZE = 60;
const FAB_RADIUS = FAB_SIZE / 2;
const CORNER_RADIUS = 22;
const FAB_OVERLAP = 30;

function buildBarPath(width: number): string {
  const h = NAVBAR_HEIGHT;
  const r = CORNER_RADIUS;

  const center = width / 2;

  // Radius of the notch
  const notchRadius = FAB_SIZE / 2 + 10;

  const left = center - notchRadius;
  const right = center + notchRadius;

  return `
    M 0 ${h}
    L 0 ${r}
    Q 0 0 ${r} 0

    L ${left} 0

    A ${notchRadius} ${notchRadius}
      0
      0 0
      ${right} 0

    L ${width - r} 0

    Q ${width} 0 ${width} ${r}

    L ${width} ${h}

    Z
  `;
}

interface BottomNavProps {
  activeTab?: TabName;
  onCenterPress?: () => void;
}

export default function BottomNav({ activeTab, onCenterPress }: BottomNavProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const barPath = buildBarPath(screenWidth);

  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  return (
    <View style={{ height: NAVBAR_HEIGHT + FAB_OVERLAP }}>
      {/* SVG bar with curved notch + shadow + rounded top corners */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: NAVBAR_HEIGHT,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Svg width={screenWidth} height={NAVBAR_HEIGHT} viewBox={`0 0 ${screenWidth} ${NAVBAR_HEIGHT}`}>
          <Path d={barPath} fill={colors.surface} />
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            // backgroundColor: colors.border,
          }}
        />
      </View>

      {/* Center FAB — center aligns with top of flat bar, bottom dips into notch */}
      {onCenterPress && (
        <View
          style={{
            position: 'absolute',
            bottom: NAVBAR_HEIGHT - FAB_RADIUS,
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
                borderWidth: 2,
                borderColor: colors.surface,
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

      {/* Tab content — aligned with the flat sections of the bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: NAVBAR_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }}>
          {leftTabs.map((tab) => {
            const isActive = tab.name === activeTab;
            return (
              <Link key={tab.name} href={tab.href} replace asChild>
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
              <Link key={tab.name} href={tab.href} replace asChild>
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
