import React, { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import StepDetailPage from '../components/routine/StepDetailPage';
import { useRoutines } from '../hooks/queries/useRoutines';
import { useSkinProfile } from '../hooks/queries/useProfile';
import { COLORS } from '../constants/theme';
import GlassIconButton from '../components/ui/GlassIconButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RoutineStepsScreen() {
  const { routineId, initialStep } = useLocalSearchParams<{
    routineId: string;
    initialStep: string;
  }>();
  const router = useRouter();
  const { data: routines } = useRoutines();
  const { data: skinProfile } = useSkinProfile();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(Number(initialStep) || 0);

  const routine = routines?.find((r) => r.id === routineId);
  const steps = (routine?.steps ?? []).slice().sort((a, b) => a.order - b.order);
  const routineLabel = routine?.type === 'AM' ? 'Morning Routine'
    : routine?.type === 'PM' ? 'Evening Routine'
    : routine?.name || 'Custom Routine';

  const concerns = skinProfile?.concerns ?? [];
  const skinType = skinProfile?.skinType ?? '';

  const onScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  const goToNext = () => {
    if (activeIndex >= steps.length - 1) {
      router.back();
      return;
    }
    const next = activeIndex + 1;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  };

  if (!routine || steps.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: 'whitesmoke' }}>
        <SafeAreaView className="flex-1 items-center justify-center">
          <Text className="text-skin-text-secondary font-poppins">No steps found</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'whitesmoke' }}>
      <SafeAreaView className="flex-1 bg-transparent" edges={['top', 'bottom']}>
        {/* Floating close button */}
        <Animated.View
          entering={FadeIn.delay(300).duration(400)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
          }}
        >
          <GlassIconButton icon="close" onPress={() => router.back()} />
        </Animated.View>

        {/* Pager */}
        <FlatList
          ref={flatListRef}
          data={steps}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          initialScrollIndex={Number(initialStep) || 0}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <StepDetailPage
              step={item}
              stepIndex={index}
              totalSteps={steps.length}
              concerns={concerns}
              skinType={skinType}
              isCompleted={item.isCompleted}
              onViewProduct={(productId) => {
                router.back();
                setTimeout(() => router.push({ pathname: '/product-detail', params: { id: productId } }), 100);
              }}
            />
          )}
        />

        {/* Bottom bar: dots + next button */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500).springify()}
          className="px-6 pb-2 flex-row items-center justify-between"
        >
          {/* Dot indicators */}
          <View className="flex-row gap-[6px]">
            {steps.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === activeIndex ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === activeIndex ? COLORS.primary : `${COLORS.primary}30`,
                }}
              />
            ))}
          </View>

          {/* Next / All Done button */}
          <Pressable
            onPress={goToNext}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 999,
              paddingHorizontal: 24,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text className="text-[14px] font-poppins-bold text-white">
              {activeIndex >= steps.length - 1 ? 'All Done!' : 'Next'}
            </Text>
            {activeIndex < steps.length - 1 && (
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            )}
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
