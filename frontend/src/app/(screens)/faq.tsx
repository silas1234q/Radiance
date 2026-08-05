import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import GlassCard from "../../components/ui/GlassCard";
import CircleIconButton from "../../components/ui/CircleIconButton";
import { COLORS } from "../../constants/theme";

const FAQ_DATA = [
  {
    question: "How does the skin analysis work?",
    answer:
      "Our AI analyzes your quiz answers (and optionally a face scan photo) to evaluate your skin across multiple metrics including hydration, elasticity, texture, and more. The results are used to generate a personalized skin score and tailored routines.",
  },
  {
    question: "How are my AM/PM routines created?",
    answer:
      "Routines are generated based on your skin profile, concerns, and goals. Our AI selects the best steps and products for your skin type, with morning routines focusing on protection and evening routines on repair.",
  },
  {
    question: "Can I customize my routine?",
    answer:
      "Yes! You can add, remove, or reorder steps in your routine. Visit the Routine tab and tap 'Edit' to make changes, or go to Routine Preferences in your profile to adjust your preferences.",
  },
  {
    question: "What is the skin score?",
    answer:
      "Your skin score is a 0-100 rating that reflects your overall skin health based on metrics like hydration, texture, elasticity, and dark spots. Track it over time on the Progress tab to see improvements.",
  },
  {
    question: "How does the face scan work?",
    answer:
      "The face scan uses your device camera to capture a photo of your face. Our AI then analyzes visible skin characteristics to provide a more accurate and detailed skin assessment alongside your quiz answers.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Absolutely. Your photos and personal data are encrypted and stored securely. We never share your information with third parties. You can delete your account and all associated data at any time from your profile.",
  },
  {
    question: "How do I log my daily skin condition?",
    answer:
      "Tap the '+' button on the Dashboard to open the skin log. You can record lifestyle factors like sleep, water intake, stress, and diet, plus add optional notes and photos.",
  },
  {
    question: "What are streaks and XP?",
    answer:
      "Completing your AM and PM routines earns XP points and builds your streak. Consistent routines are key to skin improvement. Milestone streaks (like 7 days) earn bonus XP!",
  },
  {
    question: "How do I change my skin profile?",
    answer:
      "Go to Profile > My Skin Profile. You can update your skin type, concerns, sensitivity level, and other details. Your routines will be refreshed based on the updated profile.",
  },
  {
    question: "Can I use the app without a face scan?",
    answer:
      "Yes! The face scan is optional. You can complete the skin quiz alone to receive your analysis and personalized routines. The face scan simply adds extra detail to the assessment.",
  },
];

function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    rotation.value = withTiming(next ? 90 : 0, { duration: 250 });
    height.value = withTiming(next ? 1 : 0, { duration: 250 });
    opacity.value = withTiming(next ? 1 : 0, { duration: 200 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const answerStyle = useAnimatedStyle(() => ({
    maxHeight: height.value * 300,
    opacity: opacity.value,
    overflow: "hidden" as const,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <Pressable
        onPress={toggle}
        style={{
          paddingVertical: 15,
          paddingHorizontal: 18,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(0,0,0,0.05)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: "500",
              color: COLORS.text,
              lineHeight: 21,
            }}
          >
            {question}
          </Text>
          <Animated.View style={chevronStyle}>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.textTertiary}
            />
          </Animated.View>
        </View>
        <Animated.View style={answerStyle}>
          <Text
            style={{
              fontSize: 14,
              color: COLORS.textSecondary,
              lineHeight: 20,
              marginTop: 10,
            }}
          >
            {answer}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function FAQScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = FAQ_DATA.filter(
    (item) =>
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 12,
            gap: 14,
          }}
        >
          <CircleIconButton icon="chevron-back" onPress={() => router.back()} />
          <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}>
            FAQ
          </Text>
        </View>

        {/* Search */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ paddingHorizontal: 20, marginBottom: 16 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 44,
              gap: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <Ionicons name="search" size={18} color={COLORS.textTertiary} />
            <TextInput
              placeholder="Search questions..."
              placeholderTextColor={COLORS.textTertiary}
              value={search}
              onChangeText={setSearch}
              style={{
                flex: 1,
                fontSize: 15,
                color: COLORS.text,
                paddingVertical: 0,
              }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.textTertiary}
                />
              </Pressable>
            )}
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard noPadding>
            {filtered.length > 0 ? (
              filtered.map((item, i) => (
                <FAQItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                  index={i}
                />
              ))
            ) : (
              <View style={{ padding: 24, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: COLORS.textSecondary,
                  }}
                >
                  No matching questions found.
                </Text>
              </View>
            )}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
