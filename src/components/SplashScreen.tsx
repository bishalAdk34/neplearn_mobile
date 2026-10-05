import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image, Dimensions, TouchableOpacity, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// App theme colors (tailwind.config.js: cream, brand, ink) plus the kite's crimson.
const CREAM = '#FBF9F4';
const BRAND = '#800816';
const INK = '#4A1942';
const CRIMSON = '#DC143C';

type Props = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotScale = useRef(new Animated.Value(0.5)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(dotScale, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Gentle back-and-forth drift, like a kite catching the wind.
    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const translateY = sway.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <View style={{ flex: 1, backgroundColor: CREAM }}>
        {/* Mountain background - top ~58%, fading into the cream below */}
        <View style={{ width, height: height * 0.58 }}>
          <Image
            source={require('@/assets/splash_image.webp')}
            style={{ width, height: height * 0.58 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', CREAM]}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.22 }}
          />
        </View>

        {/* Kite logo badge - overlapping the boundary */}
        <View style={{ position: 'absolute', top: height * 0.47, alignSelf: 'center' }}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateY }, { rotate }] }}>
            <View
              style={{
                width: 150,
                height: 150,
                borderRadius: 36,
                borderWidth: 4,
                borderColor: '#FFFFFF',
                overflow: 'hidden',
                backgroundColor: CREAM,
                shadowColor: INK,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 10,
              }}
            >
              <Image source={require('@/assets/icon.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          </Animated.View>
        </View>

        {/* Bottom text section */}
        <View style={{ flex: 1, alignItems: 'center', paddingTop: height * 0.12, paddingHorizontal: 24 }}>
          {/* App name */}
          <Text
            style={{
              fontSize: 38,
              fontWeight: '800',
              color: BRAND,
              letterSpacing: 0.5,
            }}
          >
            NepLearn
          </Text>

          {/* Crimson underline */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: CRIMSON,
              borderRadius: 2,
              marginTop: 8,
              marginBottom: 16,
            }}
          />

          {/* Tagline */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: INK,
              opacity: 0.8,
              letterSpacing: 2.5,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            LEARN. SPEAK. CONNECT.
          </Text>

          {/* Loading text */}
          <Text
            style={{
              fontSize: 15,
              color: INK,
              opacity: 0.6,
              fontStyle: 'italic',
              marginTop: 32,
            }}
          >
            Preparing your journey...
          </Text>

          {/* Animated dot */}
          <Animated.View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: CRIMSON,
              marginTop: 12,
              transform: [{ scale: dotScale }],
            }}
          />

          <TouchableOpacity
            onPress={onFinish}
            activeOpacity={0.8}
            style={{
              marginTop: 34,
              paddingHorizontal: 28,
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: BRAND,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '800', letterSpacing: 1 }}>CONTINUE</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={{ position: 'absolute', bottom: 90 }}>
            <Text
              style={{
                fontSize: 11,
                color: INK,
                opacity: 0.45,
                letterSpacing: 2,
                textAlign: 'center',
              }}
            >
              BRIDGING CULTURE & WISDOM
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
