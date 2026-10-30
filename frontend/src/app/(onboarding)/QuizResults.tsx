import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInDown,

} from "react-native-reanimated";
import { useAnalyzeSkin } from "@/src/hooks/queries/useQuiz";
import { COLORS } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AnalysisLoader from "@/src/components/AnalysisLoader";
import { markOnboardingComplete } from "@/src/lib/onboardingCache";

/* ---------- Types (only the fields this screen uses) ---------- */

type Priority = { title: string; advice: string };

type SkinAnalysis = {
  id: string;
  skinType: string;
  sensitivityLevel: string;
  concerns: string[];
  allergies: string[];
  ingredientsToAvoid: string[];
  analysisSource: "quiz_only" | string;
  aiAnalysisRaw: {
    summary: string;
    skincarePriorities: Priority[];
  };
};

/* ---------- Entering animation ---------- */

// Each section slides up and fades in, one after another
const enter = (index: number) =>
  FadeInDown.delay(index * 90)
    .duration(500)
    .springify()
    .damping(18);

/* ---------- Small pieces ---------- */

const SectionTitle = ({ children }: { children: string }) => (
  <Text style={{ color: COLORS.text }} className="text-lg font-sans-semibold mb-3">
    {children}
  </Text>
);

const Chip = ({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "warn";
}) => (
  <View
    style={{
      backgroundColor:
        tone === "warn" ? `${COLORS.warning}1F` : COLORS.primaryLight,
      borderColor: tone === "warn" ? COLORS.warning : "transparent",
      borderWidth: tone === "warn" ? 1 : 0,
    }}
    className="px-3.5 py-2 rounded-full mr-2 mb-2"
  >
    <Text
      style={{ color: tone === "warn" ? COLORS.text : COLORS.primaryDark }}
      className="text-sm font-sans-medium"
    >
      {label}
    </Text>
  </View>
);

/* ---------- Results view ---------- */

const Results = ({
  data,
  onScan,
  onViewRoutine,
}: {
  data: SkinAnalysis;
  onScan: () => void;
  onViewRoutine: () => void;
}) => {
  // Allergies and ingredientsToAvoid both mean "keep out of the routine"
  const avoid = Array.from(
    new Set([...data.allergies, ...data.ingredientsToAvoid]),
  );
  const priorities = data.aiAnalysisRaw.skincarePriorities ?? [];
  const quizOnly = data.analysisSource === "quiz_only";

  // Running index so the stagger stays correct when optional sections are hidden
  let step = 0;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero: skin type is the headline, since there are no scores yet */}
      <Animated.View
        entering={enter(step++)}
        style={{
          shadowColor: COLORS.primaryDark,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 18,
          elevation: 8,
        }}
        className="rounded-3xl mb-6"
      >
        {/* Inner view clips the decorative circles; the shadow lives on the wrapper */}
        <View
          style={{ backgroundColor: COLORS.primaryDark }}
          className="rounded-3xl overflow-hidden p-6"
        >
          <Text
            style={{ color: COLORS.primaryLight }}
            className="text-base font-sans-medium mb-2"
          >
            Your skin type
          </Text>
          <Text
            style={{
              color: COLORS.white,
              fontSize: 44,
              lineHeight: 48,
              letterSpacing: -0.5,
            }}
            className="font-sans-bold"
          >
            {data.skinType}
          </Text>

          <View
            style={{ backgroundColor: COLORS.white }}
            className="self-start flex-row items-center rounded-full px-4 py-2 mt-6"
          >
            <View
              style={{ backgroundColor: COLORS.primaryDark }}
              className="w-2 h-2 rounded-full mr-2"
            />
            <Text
              style={{ color: COLORS.primaryDark }}
              className="text-sm font-sans-semibold"
            >
              {data.sensitivityLevel}
            </Text>
          </View>

          {quizOnly && (
            <Text
              style={{ color: COLORS.primaryLight }}
              className="text-sm mt-5 font-sans"
            >
              Based on your quiz answers
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Summary */}
      <Animated.Text
        entering={enter(step++)}
        style={{ color: COLORS.text }}
        className="text-base leading-6 mb-7 font-sans"
      >
        {data.aiAnalysisRaw.summary}
      </Animated.Text>

      {/* Concerns */}
      <Animated.View entering={enter(step++)} className="mb-7">
        <SectionTitle>What we'll work on</SectionTitle>
        <View className="flex-row flex-wrap">
          {data.concerns.map((c) => (
            <Chip key={c} label={c} />
          ))}
        </View>
      </Animated.View>

      {/* Priorities: an ordered list, so numbering is meaningful */}
      {priorities.length > 0 && (
        <View className="mb-4">
          <Animated.View entering={enter(step++)}>
            <SectionTitle>Your skincare priorities</SectionTitle>
          </Animated.View>
          {priorities.map((p, i) => (
            <Animated.View
              key={p.title}
              entering={enter(step++)}
              style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
              }}
              className="flex-row rounded-2xl border p-4 mb-3"
            >
              <View
                style={{ backgroundColor: COLORS.primary }}
                className="w-7 h-7 rounded-full items-center justify-center mr-3 mt-0.5"
              >
                <Text
                  style={{ color: COLORS.white }}
                  className="text-sm font-sans-semibold"
                >
                  {i + 1}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  style={{ color: COLORS.text }}
                  className="text-base font-sans-semibold mb-1"
                >
                  {p.title}
                </Text>
                <Text
                  style={{ color: COLORS.textSecondary }}
                  className="text-sm leading-5 font-sans"
                >
                  {p.advice}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Avoid */}
      {avoid.length > 0 && (
        <Animated.View
          entering={enter(step++)}
          style={{
            backgroundColor: `${COLORS.warning}14`,
            borderColor: `${COLORS.warning}40`,
          }}
          className="rounded-2xl border p-5 mb-7"
        >
          <Text
            style={{ color: COLORS.text }}
            className="text-lg font-sans-semibold mb-1"
          >
            Ingredients to avoid
          </Text>
          <Text
            style={{ color: COLORS.textSecondary }}
            className="text-sm mb-3 font-sans"
          >
            We'll keep these out of your routine.
          </Text>
          <View className="flex-row flex-wrap">
            {avoid.map((a) => (
              <Chip key={a} label={a} tone="warn" />
            ))}
          </View>
        </Animated.View>
      )}

      {/* Quiz-only results are less precise, so invite a scan */}

      <Animated.View entering={enter(step++)}>
        <Pressable
          onPress={onScan}
          style={{
            backgroundColor: COLORS.primary,
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.22,
            shadowRadius: 10,
            elevation: 5,
          }}
          className="rounded-2xl p-4 mb-4 active:opacity-80"
        >
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="text-white text-base font-sans-bold mb-1">
                Scan Your Face
              </Text>
              <Text className="text-white text-sm opacity-90 font-sans">
                Get a more accurate skin analysis
              </Text>
            </View>

            <View className="bg-white/20 rounded-full p-3 ml-3">
              <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
            </View>
          </View>

          <View className="flex-row items-center mt-3 pt-3 border-t border-white/25">
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color="#FFFFFF"
            />
            <Text className="text-white text-xs ml-2 flex-1 font-sans">
              Measure hydration, oil balance and skin tone
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      </Animated.View>
      {/* Primary action */}
      <Animated.View entering={enter(step++)}>
        <Pressable
          onPress={onViewRoutine}
          style={{ backgroundColor: COLORS.primary }}
          className="rounded-2xl py-4 items-center active:opacity-80"
        >
          <Text
            style={{ color: COLORS.white }}
            className="text-base font-sans-semibold"
          >
            View my routine
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
};

/* ---------- Screen ---------- */

const QuizResults = () => {
  const { mutate, isPending, isError, isSuccess, data, error } =
    useAnalyzeSkin();
  const hasRun = useRef(false);

 useEffect(() => {
  if (!isSuccess) return;
  void markOnboardingComplete().catch((e) =>
    console.warn("[onboarding] markOnboardingComplete failed", e),
  );
}, [isSuccess])

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    mutate({ buildRoutine: true });
  }, [mutate]);




 

  const retry = () => mutate({ buildRoutine: true });

  return (
    <SafeAreaView
      style={{ backgroundColor: COLORS.background }}
      className="flex-1"
    >
      {isPending && <AnalysisLoader/>}
      {/* 
      {isError && (
        <Animated.View entering={FadeIn.duration(400)} className="flex-1 items-center justify-center px-8">
          <Text style={{ color: COLORS.text }} className="text-lg font-semibold">
            We couldn't analyse your skin
          </Text>
          <Text style={{ color: COLORS.textSecondary }} className="text-sm text-center mt-1 mb-6">
            {error?.message ?? 'Check your connection and try again.'}
          </Text>
          <Pressable
            onPress={retry}
            style={{ backgroundColor: COLORS.primary }}
            className="rounded-2xl px-8 py-3.5 active:opacity-80"
          >
            <Text style={{ color: COLORS.white }} className="font-semibold">
              Try again
            </Text>
          </Pressable>
        </Animated.View>
      )} */}

      {isSuccess && data && (
        <Results
          data={data as SkinAnalysis}
          onScan={() => {
            router.replace("/face-scan");
          }}
          onViewRoutine={() => {
            router.replace("/routine");
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default QuizResults;
