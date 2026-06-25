import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  /** Approximate height of the card (default: 120) */
  height?: number;
}

/**
 * Pulsing placeholder card shown while Firestore data is loading.
 * Matches the card grid dimensions for a seamless loading experience.
 */
export default function SkeletonCard({ height = 120 }: Props) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const s = styles(colors, height);

  return (
    <Animated.View style={[s.card, { opacity }]}>
      <View style={s.titleLine} />
      <View style={s.bodyLine} />
      <View style={s.bodyLineShort} />
    </Animated.View>
  );
}

const styles = (colors: ReturnType<typeof useTheme>['colors'], height: number) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      height,
      justifyContent: 'center',
      gap: 10,
    },
    titleLine: {
      height: 14,
      width: '60%',
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    bodyLine: {
      height: 10,
      width: '90%',
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    bodyLineShort: {
      height: 10,
      width: '45%',
      borderRadius: 4,
      backgroundColor: colors.border,
    },
  });
