import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface CountdownOverlayProps {
  number: number;
  visible: boolean;
}

export function CountdownOverlay({ number, visible }: CountdownOverlayProps) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      opacity.value = 0;
      scale.value = 0.3;
      return;
    }

    // Trigger haptic on each tick
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate in
    scale.value = 0.3;
    opacity.value = 0;
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 150 });

    // Fade out near end of tick
    const fadeTimer = setTimeout(() => {
      opacity.value = withTiming(0.3, { duration: 300 });
    }, 500);

    return () => clearTimeout(fadeTimer);
  }, [number, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Animated.Text style={styles.text}>{number}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 96,
    fontFamily: 'SFProRounded_Bold',
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});
