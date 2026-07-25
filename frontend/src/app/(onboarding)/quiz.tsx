import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  Layout,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import { quizQuestions } from '../../constants/quiz';
import { COLORS } from '../../constants/theme';
import ProgressBar from '../../components/ui/ProgressBar';
import QuestionCard from '../../components/quiz/QuestionCard';
import ToneSwatches from '../../components/quiz/ToneSwatches';
import Button from '../../components/ui/Button';
import { useSubmitQuiz } from '../../hooks/queries/useQuiz';
import { Entypo } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function QuizScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [animKey, setAnimKey] = useState(0);
  const submitQuiz = useSubmitQuiz();

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);

  // Expanding card animation values
  const [isExpanded, setIsExpanded] = useState(false);
  const cardHeight = useSharedValue(54);
  const cardRadius = useSharedValue(8);
  const buttonTextOpacity = useSharedValue(1);
  const contentOpacity = useSharedValue(0);
  const skipOpacity = useSharedValue(1);
  const spinnerRotation = useSharedValue(0);
  const dot0Scale = useSharedValue(0);
  const dot1Scale = useSharedValue(0);
  const dot2Scale = useSharedValue(0);

  const gender = answers[1] || '';
  const isFemale = gender === 'Female';
  const showAllQuestions = gender === 'Prefer not to say';

  const filteredQuestions = quizQuestions.filter((q) => {
    if (q.femaleOnly && !isFemale && !showAllQuestions) return false;
    if (q.showIf && !q.showIf(answers)) return false;
    return true;
  });

  const safeIndex = Math.min(currentIndex, filteredQuestions.length - 1);
  const question = filteredQuestions[safeIndex];
  const progress = (safeIndex + 1) / filteredQuestions.length;
  const currentAnswer = answers[question.id] || '';

  // Trigger enter animation on question change
  useEffect(() => {
    headerOpacity.value = 0;
    headerTranslateY.value = 20;
    headerOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    headerTranslateY.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) });
    setAnimKey((k) => k + 1);
  }, [safeIndex]);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const setAnswer = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (question.type === 'multiple') {
      const current = currentAnswer ? currentAnswer.split(',') : [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [question.id]: updated.join(',') });
    } else {
      setAnswers({ ...answers, [question.id]: value });
    }
  };

  const isLastQuestion = safeIndex === filteredQuestions.length - 1;
  const canProceed = question.type === 'text' || !!currentAnswer;
  const canSkip = question.femaleOnly && showAllQuestions;

  // Animated styles for expanding card
  const cardAnimStyle = useAnimatedStyle(() => ({
    height: cardHeight.value,
    borderRadius: cardRadius.value,
    overflow: 'hidden' as const,
  }));

  const buttonLabelStyle = useAnimatedStyle(() => ({
    opacity: buttonTextOpacity.value,
  }));

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [15, 0]) }],
  }));

  const skipAnimStyle = useAnimatedStyle(() => ({
    opacity: skipOpacity.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const dot0Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot0Scale.value }],
    opacity: dot0Scale.value,
  }));
  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
    opacity: dot1Scale.value,
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
    opacity: dot2Scale.value,
  }));

  const triggerExpandAnimation = () => {
    if (isExpanded) return;
    setIsExpanded(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Fade out button text + skip
    buttonTextOpacity.value = withTiming(0, { duration: 150 });
    skipOpacity.value = withTiming(0, { duration: 150 });

    // Expand card
    cardHeight.value = withTiming(220, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    cardRadius.value = withTiming(24, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    // Fade in inner content
    contentOpacity.value = withDelay(
      350,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );

    // Start spinner rotation
    spinnerRotation.value = withDelay(
      350,
      withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      )
    );

    // Pulsing dots (staggered)
    const dotPulse = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(0.3, { duration: 400, easing: Easing.in(Easing.cubic) })
      ),
      -1,
      true
    );
    dot0Scale.value = withDelay(400, dotPulse);
    dot1Scale.value = withDelay(530, dotPulse);
    dot2Scale.value = withDelay(660, dotPulse);

    // Submit after animation starts
    submitAnswers();
  };

  const resetExpandAnimation = () => {
    setIsExpanded(false);
    cancelAnimation(spinnerRotation);
    cancelAnimation(dot0Scale);
    cancelAnimation(dot1Scale);
    cancelAnimation(dot2Scale);
    cardHeight.value = withTiming(54, { duration: 300 });
    cardRadius.value = withTiming(8, { duration: 300 });
    buttonTextOpacity.value = withTiming(1, { duration: 300 });
    contentOpacity.value = 0;
    skipOpacity.value = withTiming(1, { duration: 300 });
    spinnerRotation.value = 0;
    dot0Scale.value = 0;
    dot1Scale.value = 0;
    dot2Scale.value = 0;
  };

  const submitAnswers = () => {
    const formatted = Object.entries(answers).map(([id, answer]) => ({
      questionId: parseInt(id),
      answer,
    }));
    submitQuiz.mutate(formatted, {
      onSuccess: () => router.replace('/(onboarding)/face-scan'),
      onError: () => {
        resetExpandAnimation();
      },
    });
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isLastQuestion) {
      setCurrentIndex(safeIndex + 1);
    } else {
      submitAnswers();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isLastQuestion) {
      setCurrentIndex(safeIndex + 1);
    } else {
      submitAnswers();
    }
  };

  const handleBack = () => {
    if (isExpanded) {
      resetExpandAnimation();
      return;
    }
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    } else {
      router.back();
    }
  };

  const renderOptions = () => {
    if (question.type === 'tone' && question.options) {
      return (
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <ToneSwatches
            options={question.options}
            selected={currentAnswer || null}
            onSelect={setAnswer}
          />
        </Animated.View>
      );
    }

    if (question.type === 'yesno') {
      return (
        <View className="flex-row gap-[13px] mt-[30px]">
          {['Yes', 'No'].map((opt, i) => (
            <Animated.View
              key={`${animKey}-${opt}`}
              className="flex-1"
              entering={FadeInDown.delay(200 + i * 80).duration(350).easing(Easing.out(Easing.cubic))}
            >
              <Pressable
                onPress={() => setAnswer(opt)}
                className={`h-[110px] rounded-xl items-center justify-center ${
                  currentAnswer === opt
                    ? 'border-[1.5px] border-primary bg-primary-light'
                    : 'border-[1.5px] border-skin-border bg-surface'
                }`}
              >
                <Text
                  className={`text-xl font-poppins-bold ${
                    currentAnswer === opt ? 'text-primary' : 'text-skin-text'
                  }`}
                >
                  {opt}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      );
    }

    if (question.type === 'text') {
      return (
        <Animated.View
          key={`${animKey}-text`}
          entering={FadeInDown.delay(200).duration(400)}
        >
          <TextInput
            className="mt-[26px] border-[1.5px] border-skin-border rounded-md bg-surface p-4 text-[17px] text-skin-text min-h-[120px]"
            style={{ textAlignVertical: 'top' }}
            placeholder="Type your answer..."
            placeholderTextColor={COLORS.textTertiary}
            value={currentAnswer}
            onChangeText={(text) => setAnswers({ ...answers, [question.id]: text })}
            multiline
            numberOfLines={4}
          />
        </Animated.View>
      );
    }

    // single or multiple choice
    return (
      <View className="gap-[11px] mt-[26px]">
        {question.type === 'multiple' && (
          <Text className="text-[13px] font-poppins-medium text-skin-text-tertiary mb-[-4px]">Select all that apply</Text>
        )}
        {question.options?.map((opt, i) => (
          <Animated.View
            key={`${animKey}-${opt}`}
            entering={FadeInDown.delay(150 + i * 60).duration(350).easing(Easing.out(Easing.cubic))}
          >
            <QuestionCard
              label={opt}
              selected={
                question.type === 'multiple'
                  ? currentAnswer.split(',').includes(opt)
                  : currentAnswer === opt
              }
              onPress={() => setAnswer(opt)}
              multiSelect={question.type === 'multiple'}
            />
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <Animated.View
        className="flex-row items-center gap-3.5 px-[22px] pt-[60px] pb-1.5"
        entering={FadeIn.duration(500)}
      >
        {safeIndex > 0 ? (
          <Pressable className="w-[38px] h-[38px] rounded-full bg-surface-alt items-center justify-center" onPress={handleBack}>
            <Entypo name='chevron-left' size={24}/>
          </Pressable>
        ) : (
          <View className="w-[38px]" />
        )}
        <View className="flex-1" >
          <ProgressBar progress={progress} />
        </View>
        <Text className="text-sm font-poppins-semibold text-skin-text-tertiary" style={{ fontVariant: ['tabular-nums'] }}>
          {Math.round(progress * 100)}%
        </Text>
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: 26, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={headerAnimStyle}>
          <Text className="text-[30px] font-poppins-extrabold tracking-[-0.6px] leading-[34px] text-skin-text">{question.text}</Text>
          {question.subtitle && (
            <Text className="text-[15px] text-skin-text-secondary mt-2 leading-[21px] font-poppins">{question.subtitle}</Text>
          )}
        </Animated.View>
        {renderOptions()}
      </ScrollView>

      <Animated.View
        className="px-6 pb-10 gap-3"
        entering={FadeInDown.delay(400).duration(400)}
      >
        {isLastQuestion ? (
          <AnimatedPressable
            onPress={triggerExpandAnimation}
            disabled={!canProceed || isExpanded}
            style={[
              {
                backgroundColor: COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
              cardAnimStyle,
              !canProceed && { opacity: 0.5 },
            ]}
          >
            {/* Button label — fades out */}
            <Animated.Text
              style={[buttonLabelStyle, { position: 'absolute' }]}
              className="text-lg font-poppins-bold text-white"
            >
              Submit
            </Animated.Text>

            {/* Expanded content — fades in */}
            <Animated.View
              style={[expandedContentStyle, { position: 'absolute' }]}
              className="items-center justify-center gap-4"
            >
              {/* Spinner ring */}
              <Animated.View
                style={[
                  spinnerStyle,
                  {
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 3,
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                  },
                ]}
              />

              {/* Pulsing dots */}
              <View className="flex-row gap-2.5">
                <Animated.View
                  style={[dot0Style, { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }]}
                />
                <Animated.View
                  style={[dot1Style, { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }]}
                />
                <Animated.View
                  style={[dot2Style, { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }]}
                />
              </View>

              <Text className="text-white font-poppins-semibold text-[15px]">
                Preparing your analysis...
              </Text>
            </Animated.View>
          </AnimatedPressable>
        ) : (
          <Button
            title="Continue"
            onPress={handleNext}
            disabled={!canProceed}
          />
        )}
        {canSkip && (
          <Animated.View style={skipAnimStyle}>
            <Pressable onPress={handleSkip} className="items-center py-2">
              <Text className="text-sm font-poppins-semibold text-skin-text-tertiary">
                Skip this question
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
