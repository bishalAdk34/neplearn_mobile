import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

type Props = {
  onFinish: () => void;
};

export default function SplashScreen({ onFinish }: Props) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(dotScale, { toValue: 0.5, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(onFinish);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
        {/* Mountain background - top ~58% */}
        <Image
          source={require('@/assets/splash_image.webp')}
          style={{ width, height: height * 0.58 }}
          resizeMode="cover"
        />

        {/* Circular logo badge - overlapping the boundary */}
        <View style={{ position: 'absolute', top: height * 0.50, alignSelf: 'center' }}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Image
                source={require('@/assets/neplearn_logo.png')}
                style={{ width: 140, height: 140, borderRadius: 70 }}
                resizeMode="cover"
              />
            </View>
          </Animated.View>
        </View>

        {/* Bottom text section */}
        <View style={{ flex: 1, alignItems: 'center', paddingTop: height * 0.24, paddingHorizontal: 24 }}>
          {/* App name */}
          <Text
            style={{
              fontSize: 38,
              fontWeight: '400',
              color: '#8B1A1A',
              fontFamily: 'serif',
              letterSpacing: 1,
            }}
          >
            NepLearn
          </Text>

          {/* Gold underline */}
          <View
            style={{
              width: 40,
              height: 3,
              backgroundColor: '#C9A84C',
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
              color: '#7A6A5A',
              letterSpacing: 2.5,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            NEPALI SATHI • LEARN. SPEAK.{'\n'}CONNECT.
          </Text>

          {/* Loading text */}
          <Text
            style={{
              fontSize: 15,
              color: '#9A8A7A',
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
              backgroundColor: '#C9A84C',
              marginTop: 12,
              transform: [{ scale: dotScale }],
            }}
          />

          {/* Footer */}
          <View style={{ position: 'absolute', bottom: 40 }}>
            <Text
              style={{
                fontSize: 11,
                color: '#AAA09A',
                letterSpacing: 2,
                textAlign: 'center',
              }}
            >
              BRIDGING CULTURE & WISDOM • EST. 2024
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
