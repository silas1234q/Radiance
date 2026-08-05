import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSkinProfile } from "../../hooks/queries/useProfile";
import { useWeeklyPlan } from "../../hooks/queries/useWeeklyPlan";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../constants/theme";
import CircleIconButton from "../../components/ui/CircleIconButton";
import Skeleton from "../../components/ui/Skeleton";

interface WeekMilestone {
  week: string;
  title: string;
  description: string;
}

function getFallbackWeeklyPlan(concerns: string[]): WeekMilestone[] {
  const c = concerns.map((s) => s.toLowerCase());

  const hasAcne = c.some((x) => x.includes("acne"));
  const hasTexture = c.some((x) => x.includes("texture"));
  const hasLines = c.some(
    (x) => x.includes("fine lines") || x.includes("wrinkles"),
  );
  const hasDarkSpots = c.some(
    (x) => x.includes("dark spots") || x.includes("uneven tone"),
  );
  const hasDryness = c.some((x) => x.includes("dryness"));
  const hasDullness = c.some((x) => x.includes("dullness"));
  const hasOiliness = c.some((x) => x.includes("oiliness"));
  const hasRedness = c.some((x) => x.includes("redness"));
  const hasPores = c.some((x) => x.includes("large pores"));
  const hasScarring = c.some((x) => x.includes("scarring"));

  return [
    {
      week: "Week 1",
      title: hasAcne
        ? "Calming inflammation & cleansing"
        : hasDryness
          ? "Hydration and skin barrier support"
          : hasRedness
            ? "Soothing irritation & redness"
            : "Hydration and skin barrier support",
      description: hasAcne
        ? "Active breakouts start to calm as your routine reduces bacteria and excess oil"
        : hasDryness
          ? "Skin feels smoother with reduced tightness and dryness"
          : hasRedness
            ? "Skin feels less reactive as the barrier begins to strengthen"
            : "Skin feels smoother with reduced tightness and dryness",
    },
    {
      week: "Week 2",
      title: hasLines
        ? "Reducing the appearance of fine lines"
        : hasAcne
          ? "Fewer new breakouts"
          : hasDarkSpots
            ? "Targeting pigmentation"
            : "Improving skin clarity",
      description: hasLines
        ? "Fine lines look softer and early dark spots begin to fade"
        : hasAcne
          ? "Breakout frequency decreases and existing spots begin to heal"
          : hasDarkSpots
            ? "Dark spots start to lighten as cell turnover increases"
            : "Skin starts to look clearer and more balanced day to day",
    },
    {
      week: "Week 3",
      title:
        hasTexture || hasPores
          ? "More even tone & refined texture"
          : hasDullness
            ? "Visible radiance returning"
            : hasScarring
              ? "Scar appearance softening"
              : "More even tone & refined texture",
      description:
        hasTexture || hasPores
          ? "A healthy glow develops as tone and hydration improve"
          : hasDullness
            ? "Skin looks brighter and more luminous with improved cell renewal"
            : hasScarring
              ? "Post-acne marks and scarring become less prominent"
              : "A healthy glow develops as tone and hydration improve",
    },
    {
      week: "Week 4",
      title: hasOiliness
        ? "Balanced oil production"
        : hasDryness
          ? "Healthy, well-hydrated glow"
          : hasAcne
            ? "Clearer, calmer complexion"
            : "Healthy, well-hydrated glow",
      description: hasOiliness
        ? "Sebum levels normalize and skin feels comfortable throughout the day"
        : hasDryness
          ? "Dullness is reduced and skin looks smoother and more radiant"
          : hasAcne
            ? "Skin is noticeably clearer with fewer marks and less inflammation"
            : "Dullness is reduced and skin looks smoother and more radiant",
    },
    {
      week: "Week 5+",
      title: hasLines
        ? "Ongoing maintenance and smoother texture"
        : hasAcne
          ? "Long-term clarity & prevention"
          : "Ongoing maintenance and smoother texture",
      description: hasLines
        ? "Skin stays smooth and even, with continued improvement in firmness"
        : hasAcne
          ? "Consistent routine keeps breakouts at bay and supports scar healing"
          : "Skin stays smooth and even, with continued improvement over time",
    },
  ];
}

export default function SkinGoalScreen() {
  const router = useRouter();
  const { data: skinProfile, isLoading: profileLoading } = useSkinProfile();
  const { data: weeklyPlanData, isLoading: planLoading } = useWeeklyPlan();
  const { top } = useSafeAreaInsets();
  const loading = profileLoading || planLoading;
  const concerns = skinProfile?.concerns ?? [];
  const weeklyPlan = weeklyPlanData?.milestones ?? getFallbackWeeklyPlan(concerns);

  return (
    <View style={{ flex: 1, backgroundColor: "whitesmoke", paddingTop: top }}>
      <View className="flex-1 bg-transparent">
        {/* Floating header */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 120,
          }}
        >
          {/* Fade-out gradient behind header */}
          <LinearGradient
            colors={["rgba(245,245,245,0.9)", "rgba(245,245,245,0)"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 80,
              zIndex: 0,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 12,
              backgroundColor: "transparent",
              zIndex: 1,
            }}
          >
            <View style={{ width: 34 }} />
            <Text
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: "600",
                color: COLORS.text,
                textAlign: "center",
              }}
            >
              Your Skin Goals
            </Text>
            <CircleIconButton icon="close" onPress={() => router.back()} />
          </View>
        </View>

        {loading ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 40,
              paddingTop: 50,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Goal pill skeleton */}
            <View style={{ alignItems: "center", marginTop: 20, marginBottom: 16 }}>
              <Skeleton width={220} height={50} borderRadius={999} />
            </View>

            {/* Subtitle skeleton */}
            <View style={{ alignItems: "center", marginBottom: 20, gap: 6 }}>
              <Skeleton width="90%" height={14} borderRadius={6} />
              <Skeleton width="70%" height={14} borderRadius={6} />
            </View>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: "rgba(0,0,0,0.06)",
                marginBottom: 24,
              }}
            />

            {/* Timeline heading skeleton */}
            <View style={{ marginBottom: 20 }}>
              <Skeleton width={260} height={22} borderRadius={6} />
            </View>

            {/* Week timeline skeletons */}
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 2 }}>
                <View style={{ width: 110, alignItems: "center" }}>
                  <Skeleton width={80} height={36} borderRadius={999} />
                  {i < 4 && (
                    <View
                      style={{
                        width: 2,
                        height: 60,
                        backgroundColor: "rgba(0,0,0,0.06)",
                        marginVertical: 4,
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1, paddingLeft: 12, paddingBottom: 24, gap: 6 }}>
                  <Skeleton width="80%" height={15} borderRadius={6} />
                  <Skeleton width="100%" height={14} borderRadius={6} />
                  <Skeleton width="60%" height={14} borderRadius={6} />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
            paddingTop: 50,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Goal pill */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={{
              alignItems: "center",
              marginTop: 20,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 999,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: COLORS.text,
                  textAlign: "center",
                }}
              >
                {concerns.length <= 1
                  ? concerns[0] ?? "No goal set"
                  : concerns.length === 2
                    ? `${concerns[0]} and ${concerns[1]}`
                    : `${concerns.slice(0, -1).join(", ")},\nand ${concerns[concerns.length - 1]}`}
              </Text>
            </View>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{ marginBottom: 20 }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "400",
                color: COLORS.textSecondary,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Based on your input and cross-validation with Face Scanning
              results your current skin
            </Text>
          </Animated.View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: "rgba(0,0,0,0.06)",
              marginBottom: 24,
            }}
          />

          {/* Timeline heading */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={{ marginBottom: 20 }}
          >
            <Text
              style={{ fontSize: 22, fontWeight: "700", color: COLORS.text }}
            >
              Results with consistent routine
            </Text>
          </Animated.View>

          {/* Week timeline */}
          {weeklyPlan.map((milestone, index) => (
            <Animated.View
              key={milestone.week}
              entering={FadeInDown.delay(400 + index * 100).duration(500)}
              style={{ flexDirection: "row", marginBottom: 2 }}
            >
              {/* Left column: badge + line */}
              <View style={{ width: 110, alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: COLORS.text,
                    }}
                  >
                    {milestone.week}
                  </Text>
                </View>
                {index < weeklyPlan.length - 1 && (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      backgroundColor: "rgba(0,0,0,0.06)",
                      marginVertical: 4,
                    }}
                  />
                )}
              </View>

              {/* Right column: text */}
              <View style={{ flex: 1, paddingLeft: 12, paddingBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: COLORS.text,
                    lineHeight: 21,
                  }}
                >
                  {milestone.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "400",
                    color: COLORS.textSecondary,
                    lineHeight: 20,
                    marginTop: 3,
                  }}
                >
                  {milestone.description}
                </Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
        {/* Change goal button */}
        <View className="py-6 px-5 pb-7">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              router.back();
              setTimeout(() => router.push("/edit-skin-profile"), 300);
            }}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 999,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#E0E0E0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}
            >
              Change my skin goal
            </Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </View>
    </View>
  );
}
