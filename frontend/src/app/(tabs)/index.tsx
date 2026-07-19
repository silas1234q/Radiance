import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRoutines } from "../../hooks/queries/useRoutines";
import { useProfile, useSkinProfile } from "../../hooks/queries/useProfile";
import { useLatestScore } from "../../hooks/queries/useSkinScores";
import { useGamification, useRestoreStreak } from "../../hooks/queries/useGamification";
import WeekDayTracker from "../../components/routine/WeekDayTracker";
import SectionDivider from "../../components/routine/SectionDivider";
import GoalChip from "../../components/routine/GoalChip";
import SkinDiaryCard from "../../components/dashboard/SkinDiaryCard";
import RoutineCompatibilityCard from "../../components/dashboard/RoutineCompatibilityCard";
import HomeSkeleton from "../../components/dashboard/HomeSkeleton";
import { COLORS } from "../../constants/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { data: user } = useProfile();
  const { data: routines, isLoading: routinesLoading } = useRoutines();
  const { data: skinProfile, isLoading: profileLoading } = useSkinProfile();
  const { data: latestScore, isLoading: scoreLoading } = useLatestScore();
  const { data: gamification } = useGamification();
  const restoreStreak = useRestoreStreak();

  const isLoading = routinesLoading || profileLoading || scoreLoading;

  const amSteps = routines?.find((r) => r.type === "AM")?.steps ?? [];
  const pmSteps = routines?.find((r) => r.type === "PM")?.steps ?? [];
  const hasRoutine = amSteps.length > 0 || pmSteps.length > 0;

  const topConcern = skinProfile?.concerns?.[0] || skinProfile?.skinType || "";
  const skinScore = latestScore?.score ?? skinProfile?.skinScore ?? 0;

  // Routine compatibility - derived from skin data, routine, and concerns
  const allSteps = [...amSteps, ...pmSteps];
  const totalProducts = new Set(
    allSteps.filter((s) => s.product).map((s) => s.product?.id),
  ).size;
  const totalGoals = skinProfile?.concerns?.length ?? 0;
  const goalsMetCount = Math.min(
    Math.round(totalGoals * (skinScore / 100)),
    totalGoals,
  );
  const compatibilityScore =
    hasRoutine && skinScore > 0
      ? Math.round(
          Math.min(
            skinScore * 0.7 +
              totalProducts * 5 +
              (goalsMetCount / Math.max(totalGoals, 1)) * 15,
            100,
          ),
        )
      : 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const firstName = user?.firstName;

  const glowLevel = gamification?.glowLevel;
  const xpProgress = glowLevel
    ? glowLevel.levelMaxXp > glowLevel.levelMinXp
      ? ((glowLevel.currentXp - glowLevel.levelMinXp) / (glowLevel.levelMaxXp - glowLevel.levelMinXp)) * 100
      : 100
    : 0;

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <SafeAreaView className="flex-1 bg-transparent" edges={["top"]}>
        <Animated.ScrollView
          entering={FadeIn.duration(400)}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <View className="mt-2 mb-5">
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-[30px] font-poppins-bold tracking-[-0.4px] text-skin-text">
                Home
              </Text>
              {skinProfile?.concerns?.length ? (
                <GoalChip
                  goals={skinProfile.concerns}
                  onPress={() => router.push("/skin-goal")}
                />
              ) : null}
            </View>
            <Pressable
              onPress={() => router.push("/product-search")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: 100,
                paddingHorizontal: 16,
                height: 52,
                marginTop: 12,
                gap: 12,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              <Ionicons name="search" size={20} color={COLORS.textTertiary} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontFamily: "SFProRounded_Regular",
                  color: COLORS.textTertiary,
                }}
              >
                Search skincare products...
              </Text>
            </Pressable>
          </View>
          <View className="mb-5">
            <Text className="text-2xl font-poppins-medium text-skin-text-secondary">
              {greeting}
              {firstName ? `, ${firstName}` : ""}
            </Text>
          </View>

          {/* Streak & XP Card */}
          {gamification && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* Streak */}
              <View style={{ alignItems: "center", paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 22 }}>🔥</Text>
                <Text
                  style={{
                    fontSize: 28,
                    fontFamily: "SFProRounded_Bold",
                    color: "#1C1C1E",
                    lineHeight: 32,
                  }}
                >
                  {gamification.currentStreak}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "SFProRounded_Semibold",
                    color: "#8E8E93",
                  }}
                >
                  Day Streak
                </Text>
              </View>

              {/* Divider */}
              <View style={{ width: 1, height: 50, backgroundColor: "#F0F0F0" }} />

              {/* XP + Glow Level */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "SFProRounded_Medium",
                    color: "#8E8E93",
                  }}
                >
                  Glow Level
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: "SFProRounded_Bold",
                    color: "#1C1C1E",
                  }}
                >
                  {glowLevel?.label ?? "Seedling"}
                </Text>
                <View
                  style={{
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: "#FFE0E6",
                    overflow: "hidden",
                    marginTop: 8,
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${Math.min(100, xpProgress)}%`,
                      borderRadius: 3,
                      backgroundColor: COLORS.primary,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "SFProRounded_Medium",
                    color: "#AEAEB2",
                    marginTop: 4,
                  }}
                >
                  {gamification.totalXp.toLocaleString()} / {(glowLevel?.levelMaxXp ?? 500).toLocaleString()} XP
                </Text>
              </View>
            </View>
          )}

          {/* Streak Restore Banner */}
          {gamification?.canRestoreStreak && (
            <Pressable
              onPress={() => restoreStreak.mutate()}
              disabled={restoreStreak.isPending}
              style={{
                backgroundColor: "#FFF3E0",
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Ionicons name="flame" size={24} color="#FF9500" />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "SFProRounded_Semibold",
                    color: "#1C1C1E",
                  }}
                >
                  You missed yesterday!
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "SFProRounded_Regular",
                    color: "#8E8E93",
                    marginTop: 2,
                  }}
                >
                  Restore your {gamification.currentStreak}-day streak? ({gamification.streakRestoresLeft} left)
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#FF9500",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontFamily: "SFProRounded_Bold" }}>
                  Restore
                </Text>
              </View>
            </Pressable>
          )}

          {/* Routine Compatibility */}
          {hasRoutine && (
            <RoutineCompatibilityCard
              compatibilityScore={compatibilityScore}
              goalsMetCount={goalsMetCount}
              totalGoals={totalGoals}
              productCount={totalProducts}
              onPress={() => router.push("/my-routine")}
            />
          )}

          {/* Skin Diary */}
          <SectionDivider label="Skin Diary" />
          <SkinDiaryCard />
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}
