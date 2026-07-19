import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const COLORS = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F0A500'];
const PIECE_COUNT = 45;

const screen = Dimensions.get('window');

interface ConfettiPieceProps {
  color: string;
  size: number;
}

const ConfettiPiece = ({ color, size }: ConfettiPieceProps) => {
  const anim = useRef(new Animated.Value(0)).current;
  const targets = useRef({
    x: (Math.random() - 0.5) * screen.width * 1.4,
    y: screen.height * 0.15 + Math.random() * screen.height * 0.7,
  }).current;

  useEffect(() => {
    const delay = Math.random() * 500;
    Animated.parallel([
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1800 + Math.random() * 1200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${Math.random() * 720 - 360}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: screen.height * 0.25,
        left: screen.width * 0.5 - size / 2,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 4,
        opacity,
        transform: [
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, targets.x] }) },
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, targets.y] }) },
          { rotate },
        ],
      }}
    />
  );
};

interface ConfettiProps {
  active: boolean;
}

export default function Confetti({ active }: ConfettiProps) {
  const pieces = useRef(
    Array.from({ length: PIECE_COUNT }, (_, i) => ({
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
    }))
  ).current;

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} color={p.color} size={p.size} />
      ))}
    </View>
  );
}
