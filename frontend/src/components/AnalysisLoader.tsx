import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "@/src/constants/theme";

/* One pulsing dot. Each dot owns its animation, so they can be staggered safely. */
const Dot = ({ delay }: { delay: number }) => {
  const scale = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
          withTiming(0.3, { duration: 400, easing: Easing.in(Easing.cubic) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(scale);
  }, [delay, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: COLORS.primary,
        },
        style,
      ]}
    />
  );
};

const AnalysisLoader = () => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center px-8"
    >
      <Animated.View
        style={[
          {
            width: 56,
            height: 56,
            borderRadius: 28,
            borderWidth: 4,
            borderColor: COLORS.primaryLight,
            borderTopColor: COLORS.primary,
          },
          ringStyle,
        ]}
      />

      <View className="flex-row gap-2.5 mt-6">
        <Dot delay={0} />
        <Dot delay={130} />
        <Dot delay={260} />
      </View>

      <Text
        style={{ color: COLORS.text }}
        className="text-lg font-sans-semibold mt-6"
      >
        Preparing your analysis...
      </Text>
      <Text
        style={{ color: COLORS.textSecondary }}
        className="text-sm text-center mt-1 font-sans"
      >
        Building your skin profile and routine. This takes a few seconds.
      </Text>
    </Animated.View>
  );
};

export default AnalysisLoader;