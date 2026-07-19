import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';

interface XpToastProps {
  xp: number;
  visible: boolean;
  onHide: () => void;
}

export default function XpToast({ xp, visible, onHide }: XpToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1200, withTiming(0, { duration: 400 }, () => {
          runOnJS(onHide)();
        })),
      );
      translateY.value = withSequence(
        withTiming(0, { duration: 200 }),
        withDelay(1200, withTiming(-20, { duration: 400 })),
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 60,
          alignSelf: 'center',
          backgroundColor: COLORS.primary,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 4,
          zIndex: 999,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'SFProRounded_Bold' }}>
        +{xp} XP
      </Text>
    </Animated.View>
  );
}
