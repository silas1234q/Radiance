import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface CaptureFlashProps {
  trigger: boolean;
}

export function CaptureFlash({ trigger }: CaptureFlashProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      opacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.flash, animatedStyle]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
});
