import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useAnalyzeSkin } from '../../hooks/queries/useQuiz';
import { COLORS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  'Analyzing your skin profile...',
  'Identifying key concerns...',
  'Matching ingredients...',
  'Building your routine...',
];

export default function AnalyzingScreen() {
  const router = useRouter();
  const analyzeSkin = useAnalyzeSkin();
  const steps = STEPS;
  const [stepIndex, setStepIndex] = useState(0);
  const hasAnalyzed = useRef(false);

  // Outer ring pulse
  const outerRingScale = useSharedValue(1);
  const outerRingOpacity = useSharedValue(0.15);

  // Middle ring pulse
  const midRingScale = useSharedValue(1);
  const midRingOpacity = useSharedValue(0.25);

  // Inner spinner
  const spinnerRotation = useSharedValue(0);

  // Orbital dots
  const orbitRotation = useSharedValue(0);

  // Glow pulse
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);

  // Content fade in
  const contentOpacity = useSharedValue(0);

  // Step text
  const stepOpacity = useSharedValue(0);

  // Progress bar
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Fade in content
    contentOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });

    // Glow pulse — breathe in and out
    glowOpacity.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.1, { duration: 2000, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    ));
    glowScale.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    ));

    // Outer ring breathing
    outerRingScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2500, easing: Easing.inOut(Easing.cubic) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    );
    outerRingOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 2500, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.1, { duration: 2500, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    );

    // Middle ring breathing (offset phase)
    midRingScale.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    ));
    midRingOpacity.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    ));

    // Inner spinner — smooth rotation
    spinnerRotation.value = withRepeat(
      withTiming(360, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );

    // Orbital dots — slower counter-rotation
    orbitRotation.value = withRepeat(
      withTiming(-360, { duration: 6000, easing: Easing.linear }),
      -1,
      false
    );

    // Step text initial fade in
    stepOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    // Progress bar — animate slowly across full duration
    progressWidth.value = withTiming(0.9, {
      duration: 25000,
      easing: Easing.out(Easing.quad),
    });

    // Trigger analysis (guard against re-mount / back-nav)
    if (!hasAnalyzed.current) {
      hasAnalyzed.current = true;
      const onSuccess = () => {
        progressWidth.value = withTiming(1, { duration: 400 });
        setTimeout(() => router.replace('/(onboarding)/results'), 500);
      };
      const onError = () => {
        progressWidth.value = withTiming(1, { duration: 400 });
        setTimeout(() => router.replace('/(onboarding)/results?error=1'), 500);
      };
      analyzeSkin.mutate(undefined, { onSuccess, onError });
    }
  }, []);

  // Cycle through step messages
  useEffect(() => {
    const interval = setInterval(() => {
      stepOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setStepIndex)((prev: number) => (prev + 1) % steps.length);
        stepOpacity.value = withTiming(1, { duration: 400 });
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerRingScale.value }],
    opacity: outerRingOpacity.value,
  }));

  const midRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: midRingScale.value }],
    opacity: midRingOpacity.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation.value}deg` }],
  }));

  const stepTextStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as `${number}%`,
  }));

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Animated.View style={containerStyle} className="items-center">
        {/* Rings container */}
        <View className="items-center justify-center mb-14" style={{ width: 200, height: 200 }}>
          {/* Background glow */}
          <Animated.View
            style={[
              glowStyle,
              {
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: COLORS.primary,
              },
            ]}
          />

          {/* Outer ring */}
          <Animated.View
            style={[
              outerRingStyle,
              {
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: 90,
                borderWidth: 1.5,
                borderColor: COLORS.primary,
              },
            ]}
          />

          {/* Middle ring */}
          <Animated.View
            style={[
              midRingStyle,
              {
                position: 'absolute',
                width: 130,
                height: 130,
                borderRadius: 65,
                borderWidth: 1.5,
                borderColor: COLORS.primary,
              },
            ]}
          />

          {/* Inner spinner ring */}
          <Animated.View
            style={[
              spinnerStyle,
              {
                position: 'absolute',
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 2.5,
                borderColor: COLORS.primaryLight,
                borderTopColor: COLORS.primary,
                borderRightColor: COLORS.primary,
              },
            ]}
          />

          {/* Orbital dots */}
          <Animated.View
            style={[
              orbitStyle,
              {
                position: 'absolute',
                width: 156,
                height: 156,
              },
            ]}
          >
            {/* Dot at top */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 156 / 2 - 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: COLORS.primary,
                opacity: 0.8,
              }}
            />
            {/* Dot at bottom-left */}
            <View
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: COLORS.primary,
                opacity: 0.5,
              }}
            />
            {/* Dot at bottom-right */}
            <View
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: COLORS.primary,
                opacity: 0.35,
              }}
            />
          </Animated.View>

          {/* Center icon — sparkle dot */}
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: COLORS.primary,
            }}
          />
        </View>

        {/* Title */}
        <Text className="text-[26px] font-poppins-extrabold text-skin-text tracking-[-0.4px] mb-2.5">
          Crafting your plan
        </Text>

        {/* Rotating step text */}
        <Animated.Text
          style={stepTextStyle}
          className="text-[15px] font-poppins text-skin-text-secondary text-center leading-[21px] mb-8"
        >
          {steps[stepIndex]}
        </Animated.Text>

        {/* Progress bar */}
        <View
          style={{
            width: SCREEN_WIDTH - 100,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLORS.primaryLight,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              progressBarStyle,
              {
                height: 4,
                borderRadius: 2,
                backgroundColor: COLORS.primary,
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}
