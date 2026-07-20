import React, { useEffect } from "react";
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  Image,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { COLORS, GLASS } from "../../constants/theme";
import { getStepIcon } from "../../utils/stepIcons";
import type { RoutineStep } from "../../types/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StepDetailPageProps {
  step: RoutineStep;
  stepIndex: number;
  totalSteps: number;
  concerns: string[];
  skinType: string;
  isCompleted: boolean;
  onViewProduct?: (productId: string) => void;
}

function GlassCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(500).springify()}
      style={{
        backgroundColor: GLASS.background,
        borderWidth: GLASS.borderWidth,
        borderColor: GLASS.borderColor,
        borderRadius: GLASS.borderRadius,
        padding: 18,
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function StepDetailPage({
  step,
  stepIndex,
  totalSteps,
  concerns,
  skinType,
  isCompleted,
  onViewProduct,
}: StepDetailPageProps) {
  const { icon, color } = getStepIcon(step.name);
  const topConcern = concerns[0] || skinType || "your skin";

  // Breathing pulse animation for the icon
  const breatheScale = useSharedValue(1);

  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.08, {
          duration: 1250,
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      true,
    );
  }, []);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  const rationale =
    step.aiRationale ||
    `${step.name} is an essential step in your routine. It helps support your skin's health and targets ${topConcern}.`;

  const goalSentence = getGoalSentence(step.name, topConcern);

  return (
    <View style={{ width: SCREEN_WIDTH }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <Animated.Text
          entering={FadeInDown.delay(100).duration(400)}
          className="text-[13px] font-poppins-semibold text-skin-text-secondary mb-6"
        >
          Step {stepIndex + 1} of {totalSteps}
        </Animated.Text>

        {/* Icon with breathing pulse */}
        <Animated.View
          style={[
            breatheStyle,
            {
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: `${color}18`,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            },
          ]}
        >
          <Ionicons name={icon} size={44} color={color} />
        </Animated.View>

        {/* Step name */}
        <Animated.Text
          entering={FadeInDown.delay(200).duration(500).springify()}
          className="text-[26px] font-poppins-bold text-skin-text text-center tracking-[-0.4px] mb-6"
        >
          {step.name}
        </Animated.Text>

        {/* Why this matters */}
        <View className="w-full mb-3">
          <GlassCard delay={400}>
            <Text className="text-[13px] font-poppins-semibold text-skin-text-secondary mb-1.5 uppercase tracking-[0.5px]">
              Why this matters
            </Text>
            <Text className="text-[14px] font-poppins text-skin-text leading-[21px]">
              {rationale}
            </Text>
          </GlassCard>
        </View>

        {/* How it helps your goal */}
        <View className="w-full mb-3">
          <GlassCard delay={550}>
            <Text className="text-[13px] font-poppins-semibold text-skin-text-secondary mb-1.5 uppercase tracking-[0.5px]">
              How it helps your goal
            </Text>
            <Text className="text-[14px] font-poppins text-skin-text leading-[21px]">
              {goalSentence}
            </Text>
          </GlassCard>
        </View>

        {/* Product recommendation */}
        {step.product && (
          <View className="w-full mb-3">
            <GlassCard delay={700}>
              <Text className="text-[13px] font-poppins-semibold text-skin-text-secondary mb-2 uppercase tracking-[0.5px]">
                Recommended product
              </Text>
              {step.product.imageUrl && (
                <Image
                  source={{ uri: step.product.imageUrl }}
                  style={{
                    width: "100%",
                    height: 160,
                    borderRadius: 14,
                    marginBottom: 12,
                    backgroundColor: "#f0f0f0",
                  }}
                  resizeMode="contain"
                />
              )}
              <Text className="text-[16px] font-poppins-bold text-skin-text">
                {step.product.name}
              </Text>
              {step.product.brand && (
                <Text className="text-[13px] font-poppins text-skin-text-secondary mt-0.5">
                  {step.product.brand}
                </Text>
              )}
              {step.product.category && (
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: `${COLORS.primary}15`,
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    marginTop: 8,
                  }}
                >
                  <Text
                    className="text-[12px] font-poppins-medium"
                    style={{ color: COLORS.primary }}
                  >
                    {step.product.category}
                  </Text>
                </View>
              )}
              <Pressable
                onPress={() => onViewProduct?.(step.product!.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: `${COLORS.primary}10`,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: COLORS.primary,
                  }}
                >
                  View product details
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.primary}
                />
              </Pressable>
            </GlassCard>
          </View>
        )}

        {/* Usage instructions */}
        {step.description && (
          <View className="w-full">
            <GlassCard delay={850}>
              <Text className="text-[13px] font-poppins-semibold text-skin-text-secondary mb-1.5 uppercase tracking-[0.5px]">
                How to use
              </Text>
              <Text className="text-[14px] font-poppins text-skin-text leading-[21px]">
                {step.description}
              </Text>
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getGoalSentence(stepName: string, concern: string): string {
  const name = stepName.toLowerCase();
  if (name.includes("cleanser") || name.includes("face wash")) {
    return `Cleansing removes impurities and excess oil that can contribute to ${concern}.`;
  }
  if (name.includes("toner")) {
    return `Toning balances your skin's pH and preps it to better absorb treatments for ${concern}.`;
  }
  if (name.includes("serum")) {
    return `Serums deliver concentrated active ingredients that directly target ${concern}.`;
  }
  if (name.includes("moisturizer")) {
    return `Moisturizing strengthens your skin barrier, which is key to managing ${concern}.`;
  }
  if (name.includes("sunscreen") || name.includes("spf")) {
    return `UV protection prevents damage that can worsen ${concern} and cause premature aging.`;
  }
  if (name.includes("exfoliat")) {
    return `Exfoliating removes dead skin cells, helping reduce the appearance of ${concern}.`;
  }
  if (name.includes("eye cream")) {
    return `Eye cream targets the delicate eye area, addressing ${concern} where skin is thinnest.`;
  }
  if (name.includes("retinol")) {
    return `Retinol accelerates cell turnover, a proven approach for improving ${concern}.`;
  }
  if (name.includes("mask")) {
    return `Masks provide an intensive treatment boost to help address ${concern}.`;
  }
  return `This step supports your overall skin health and helps target ${concern}.`;
}
