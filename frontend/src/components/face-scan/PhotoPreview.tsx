import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/theme';

const QUALITY_CHECKS = ['Face visible', 'Well lit', 'No filters'];

interface PhotoPreviewProps {
  photoUri: string;
  error: string | null;
  onAnalyze: () => void;
  onRetake: () => void;
}

function QualityChip({ label, index }: { label: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(150 + index * 100).duration(400)}
      style={{ borderRadius: 999, overflow: 'hidden' }}
    >
      <BlurView
        tint="dark"
        intensity={25}
        experimentalBlurMethod="dimezisBlurView"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 7,
          backgroundColor: 'rgba(0,0,0,0.25)',
        }}
      >
        <Text className="text-[10px] text-success mr-1.5">{'✓'}</Text>
        <Text className="text-[12px] font-poppins-medium text-white">{label}</Text>
      </BlurView>
    </Animated.View>
  );
}

export function PhotoPreview({ photoUri, error, onAnalyze, onRetake }: PhotoPreviewProps) {
  const insets = useSafeAreaInsets();

  const photoScale = useSharedValue(1.04);
  const photoOpacity = useSharedValue(0);

  useEffect(() => {
    photoScale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    photoOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: photoScale.value }],
    opacity: photoOpacity.value,
  }));

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.dark, paddingTop: insets.top }}>
      {/* Caption */}
      <Animated.View entering={FadeIn.duration(400)} className="items-center pt-4 pb-3">
        <Text
          className="text-[11px] font-poppins-semibold tracking-[3px] uppercase"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Photo Captured
        </Text>
      </Animated.View>

      {/* Hero photo */}
      <Animated.View
        className="flex-1 mx-4"
        style={[
          {
            borderRadius: 28,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          },
          photoStyle,
        ]}
      >
        <Image
          source={{ uri: photoUri }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />

        {/* Bottom scrim */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' }}
        />

        {/* Scrim content */}
        <View className="absolute left-0 right-0 bottom-0 px-5 pb-6">
          <View className="flex-row gap-2 mb-4">
            {QUALITY_CHECKS.map((label, i) => (
              <QualityChip key={label} label={label} index={i} />
            ))}
          </View>
          <Animated.Text
            entering={FadeInUp.delay(200).duration(400)}
            className="text-[24px] font-poppins-bold text-white mb-1"
          >
            Looking good!
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(280).duration(400)}
            className="text-[14px] font-poppins-regular leading-[21px]"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            This photo will be used for your personalized skin analysis.
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Error banner */}
      {error && (
        <Animated.View entering={FadeInDown.duration(300)} className="mx-5 mt-4">
          <View
            className="px-5 py-3 items-center"
            style={{ borderRadius: 999, backgroundColor: 'rgba(255,59,48,0.25)' }}
          >
            <Text className="text-[13px] font-poppins-medium text-white text-center">{error}</Text>
          </View>
        </Animated.View>
      )}

      {/* Bottom controls */}
      <Animated.View
        entering={FadeInUp.delay(350).duration(450)}
        className="px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <Pressable
          onPress={onAnalyze}
          className="h-[56px] rounded-2xl bg-primary items-center justify-center mb-3"
          style={({ pressed }) => [
            {
              shadowColor: COLORS.primary,
              shadowOpacity: 0.45,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text className="text-[16px] font-poppins-semibold text-white tracking-[0.5px]">
            Analyze My Skin
          </Text>
        </Pressable>
        <Pressable
          onPress={onRetake}
          className="h-[48px] items-center justify-center"
          style={({ pressed }) => [
            { borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            className="text-[15px] font-poppins-semibold"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            Retake Photo
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
