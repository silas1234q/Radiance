import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  RefreshControl,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import Svg, {
  Circle,
  Polygon,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { LineChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { useSkinScores } from "../../hooks/queries/useSkinScores";
import { useSkinLogs } from "../../hooks/queries/useSkinLogs";
import { useProfile, useSkinProfile } from "../../hooks/queries/useProfile";
import { useRoutines } from "../../hooks/queries/useRoutines";
import { useGamification, useWeeklyCompletions } from "../../hooks/queries/useGamification";
// ScreenBackground removed — using flat gray bg like home screen
import type { SkinScore } from "../../types/api";
import Animated, { FadeInDown } from "react-native-reanimated";
import { COLORS, GLASS } from "@/src/constants/theme";
import defaultProfile from "@/src/assets/images/defaultProfile.jpg";
import Fire from "@/src/assets/images/fire.png";
import { buildAiInsight } from "../../lib/skinSummary";
import { SafeAreaView } from "react-native-safe-area-context";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_PADDING = 20;
const HALF_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

// Accent palette derived from primary (#F06680)
const ACCENT = {
  primary: COLORS.primary,        // #F06680
  light: "#FF8FA3",               // lighter pink
  ultraLight: COLORS.primaryLight, // #FFE0E6
  gradient1: COLORS.primary,      // #F06680
  gradient2: "#FF8FA3",           // lighter end
};

// ── Glow Level helpers ──

function getGlowLevel(score: number): {
  label: string;
  xp: number;
  nextXp: number;
} {
  if (score >= 90) return { label: "Luminous", xp: score * 30, nextXp: 3000 };
  if (score >= 75) return { label: "Radiant", xp: score * 28, nextXp: 3000 };
  if (score >= 60) return { label: "Glowing", xp: score * 25, nextXp: 2500 };
  if (score >= 40) return { label: "Emerging", xp: score * 20, nextXp: 2000 };
  return { label: "Seedling", xp: score * 15, nextXp: 1500 };
}

function computeStreak(scores: SkinScore[]): number {
  if (!scores || scores.length === 0) return 0;
  const sorted = [...scores].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  let streak = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff === streak || diff === streak + 1) {
      streak = diff + 1;
    } else {
      break;
    }
  }
  return Math.max(streak, 1);
}

function getScoreMessage(score: number): string {
  if (score >= 85) return "Amazing results!";
  if (score >= 70) return "Great progress!";
  if (score >= 50) return "Keep going!";
  return "Just getting started!";
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Circular Score Ring ──

function ScoreRing({ score, size = 130 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={ACCENT.gradient1} />
            <Stop offset="1" stopColor={ACCENT.gradient2} />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFE0E6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text
          style={{
            fontSize: 38,
            fontFamily: "SFProRounded_Bold",
            color: "#1C1C1E",
          }}
        >
          {score}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "SFProRounded_Medium",
            color: "#8E8E93",
            marginTop: -2,
          }}
        >
          /100
        </Text>
      </View>
    </View>
  );
}

// ── Shield Badge ──

function ShieldBadge() {
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: ACCENT.ultraLight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="shield-checkmark" size={28} color={ACCENT.primary} />
    </View>
  );
}

// ── Radar Chart ──

const RADAR_LABELS = ["Hydration", "Oil\nBalance", "Acne", "Pigmentation", "Barrier\nStrength"];

function getRadarPoints(
  values: number[],
  cx: number,
  cy: number,
  maxR: number,
): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (v / 100) * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");
}

function getPolygonPoints(n: number, cx: number, cy: number, r: number): string {
  return Array.from({ length: n })
    .map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");
}

interface RadarChartProps {
  values: number[];
  labels: string[];
  size?: number;
}

function RadarChart({ values, labels, size = 180 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const n = values.length;
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        {/* Grid rings */}
        {rings.map((scale) => (
          <Polygon
            key={scale}
            points={getPolygonPoints(n, cx, cy, maxR * scale)}
            fill="none"
            stroke="#E8E0F0"
            strokeWidth={0.8}
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: n }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + maxR * Math.cos(angle)}
              y2={cy + maxR * Math.sin(angle)}
              stroke="#E8E0F0"
              strokeWidth={0.8}
            />
          );
        })}
        {/* Ideal range (80% fill) */}
        <Polygon
          points={getRadarPoints([80, 80, 80, 80, 80], cx, cy, maxR)}
          fill={`${ACCENT.primary}10`}
          stroke={`${ACCENT.primary}30`}
          strokeWidth={1}
          strokeDasharray="4,3"
        />
        {/* User data */}
        <Polygon
          points={getRadarPoints(values, cx, cy, maxR)}
          fill={`${ACCENT.primary}20`}
          stroke={ACCENT.primary}
          strokeWidth={2}
        />
        {/* Data points */}
        {values.map((v, i) => {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const r = (v / 100) * maxR;
          return (
            <Circle
              key={i}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r={3.5}
              fill="#fff"
              stroke={ACCENT.primary}
              strokeWidth={2}
            />
          );
        })}
      </Svg>
      {/* Labels positioned around the chart */}
      {labels.map((label, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const labelR = maxR + 22;
        const x = cx + labelR * Math.cos(angle);
        const y = cy + labelR * Math.sin(angle);
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: x - 30,
              top: y - 10,
              width: 60,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontFamily: "SFProRounded_Medium",
                color: "#8E8E93",
                textAlign: "center",
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "SFProRounded_Bold",
                color: "#1C1C1E",
              }}
            >
              {values[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Gem Icon ──

function GemIcon({ size = 48 }: { size?: number }) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48">
      <Defs>
        <SvgGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F06680" />
          <Stop offset="0.5" stopColor="#FF8FA3" />
          <Stop offset="1" stopColor="#FFB3C1" />
        </SvgGradient>
      </Defs>
      <Polygon points="24,4 42,18 24,44 6,18" fill="url(#gemGrad)" />
      <Polygon points="24,4 42,18 24,18" fill="#FFB3C1" opacity={0.6} />
      <Polygon points="6,18 24,18 24,4" fill="#F06680" opacity={0.8} />
      <Polygon points="6,18 24,44 24,18" fill="#E8556E" opacity={0.5} />
      <Line x1="6" y1="18" x2="42" y2="18" stroke="#fff" strokeWidth={0.8} opacity={0.5} />
      <Line x1="24" y1="4" x2="24" y2="44" stroke="#fff" strokeWidth={0.5} opacity={0.3} />
    </Svg>
  );
}

// ── Consistency helpers ──

const DAYS_OF_WEEK = ["M", "T", "W", "T", "F", "S", "S"];


function getTopImprovements(scores: SkinScore[]): { label: string; change: number; icon: keyof typeof Ionicons.glyphMap }[] {
  if (scores.length < 2) return [];
  const sorted = [...scores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const oldest = sorted[0];
  const latest = sorted[sorted.length - 1];

  const metrics: { label: string; key: keyof SkinScore; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: "Barrier Strength", key: "texture", icon: "shield-outline" },
    { label: "Hydration", key: "hydration", icon: "water-outline" },
    { label: "Texture Clarity", key: "evenTone", icon: "sparkles-outline" },
    { label: "Oil Balance", key: "oilBalance", icon: "scale-outline" },
    { label: "Sensitivity", key: "sensitivity", icon: "flower-outline" },
  ];

  return metrics
    .map((m) => {
      const oldVal = (oldest[m.key] as number | null) ?? 0;
      const newVal = (latest[m.key] as number | null) ?? 0;
      return { label: m.label, change: newVal - oldVal, icon: m.icon };
    })
    .filter((m) => m.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 3);
}

// ── Achievement Badge ──

// ── Main Screen ──

export default function ProgressScreen() {
  const router = useRouter();
  const { data: scores } = useSkinScores();
  const { data: profile } = useSkinProfile();
  const { data: routines } = useRoutines();
  const { data: skinLogs } = useSkinLogs();
  const { data: user } = useProfile();
  const { data: gamification } = useGamification();
  const { data: weeklyCompletions } = useWeeklyCompletions();

  const queryClient = useQueryClient();
  const [scanRange, setScanRange] = useState<"5" | "10" | "all">("all");
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const INFO_DETAILS: Record<string, { title: string; description: string }> = {
    skinHealth: {
      title: "Skin Health Score",
      description:
        "Your overall skin health score (0–100) is calculated from five key metrics: hydration, oil balance, texture clarity, even tone, and sensitivity. A higher score means your skin is closer to its ideal balance. Track it over time to see how your routine is working.",
    },
    skinRadar: {
      title: "Skin Balance Radar",
      description:
        "The radar chart maps five dimensions of your skin — Hydration, Oil Balance, Acne Resilience, Pigmentation, and Barrier Strength. The colored area represents your current levels, while the faded area shows the ideal range. A fuller shape means more balanced skin.",
    },
    goalProgress: {
      title: "Goal Progress",
      description:
        "This tracks how close you are to your ultimate skin goal based on your current skin health score. Keep completing your AM/PM routines and logging your skin to move the progress bar forward.",
    },
    consistency: {
      title: "Consistency",
      description:
        "Shows your daily routine completion for the current week. A filled circle means you completed both your AM and PM routines plus a mood log. A partially filled circle means you completed some but not all. Consistency is key to seeing real skin improvements.",
    },
  };

  const latestScore =
    scores && scores.length > 0
      ? [...scores].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )[0].score
      : 0;

  const glowLevel = gamification
    ? {
        label: gamification.glowLevel.label,
        xp: gamification.totalXp,
        nextXp: gamification.glowLevel.levelMaxXp,
      }
    : getGlowLevel(latestScore);
  const streak = gamification?.currentStreak ?? computeStreak(scores ?? []);
  const scoreMessage = getScoreMessage(latestScore);

  // Consistency from real daily completions
  const weekConsistency = useMemo(() => {
    if (weeklyCompletions && weeklyCompletions.length > 0) {
      return DAYS_OF_WEEK.map((day, i) => {
        // DAYS_OF_WEEK is M-S (0=Mon), weeklyCompletions dayIndex is 0=Sun
        const dayIndex = i === 6 ? 0 : i + 1; // map M=1,T=2,...S=0
        const comp = weeklyCompletions.find((c) => c.dayIndex === dayIndex);
        return { completed: comp?.isFullDay ?? false, partial: comp ? (comp.amCompleted || comp.pmCompleted || comp.moodLogged) && !comp.isFullDay : false, day };
      });
    }
    return DAYS_OF_WEEK.map((day) => ({ completed: false, partial: false, day }));
  }, [weeklyCompletions]);
  const completedDays = weekConsistency.filter((d) => d.completed).length;
  const topImprovements = useMemo(() => getTopImprovements(scores ?? []), [scores]);

  // Before vs Now photos. "Before" is the immutable first (onboarding) scan;
  // "Now" is the latest scan when the user has re-scanned, otherwise the most
  // recent logged progress photo.
  const firstScanPhoto = profile?.baselinePhotoUrl ?? profile?.photoUrl ?? null;
  const latestLogPhoto = useMemo(() => {
    if (!skinLogs || skinLogs.length === 0) return null;
    const withPhoto = skinLogs.filter((l) => l.photoUrl);
    return withPhoto.length > 0 ? withPhoto[0].photoUrl : null;
  }, [skinLogs]);
  const latestScanPhoto = profile?.photoUrl ?? null;
  const nowPhoto =
    latestScanPhoto && latestScanPhoto !== firstScanPhoto
      ? latestScanPhoto
      : latestLogPhoto;

  // AI Insight message derived from real data (shared with the summary screen).
  const aiInsight = useMemo(() => buildAiInsight(scores, gamification), [scores, gamification]);

  // Build chart data from skin scan scores
  const chartData = useMemo(() => {
    if (!scores || scores.length === 0)
      return { actual: [] };

    const sorted = [...scores].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const sliced = scanRange === "all" ? sorted : sorted.slice(-Number(scanRange));

    const actual = sliced.map((s, i, arr) => ({
      value: s.score,
      label: formatDateLabel(s.date),
      dataPointText: i === arr.length - 1 || arr.length === 1 ? String(s.score) : "",
    }));

    return { actual };
  }, [scores, scanRange]);

  // Goal estimation from real XP growth rate
  const targetScore = 90;
  const weeksToGoal = useMemo(() => {
    if (!scores || scores.length < 2 || latestScore >= targetScore) return null;
    const sorted = [...scores].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const recent = sorted.slice(-4);
    const avgGain =
      recent.reduce((sum, s, i) => {
        if (i === 0) return 0;
        return sum + (s.score - recent[i - 1].score);
      }, 0) /
      (recent.length - 1);
    if (avgGain <= 0) return null;
    return Math.ceil((targetScore - latestScore) / avgGain);
  }, [scores, latestScore]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2F2F7" }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: CARD_PADDING,
          paddingTop: 10,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT.primary}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 30,
                fontFamily: "SFProRounded_Medium",
                color: COLORS.text,
              }}
            >
              Analysis
            </Text>
            <Text
              style={{ color: "#9ca3af", fontFamily: "SFProRounded_Regular" }}
            >
              Track, Improve, Glow.
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              overflow: "hidden",
            }}
          >
            <Image
              source={user?.avatarUrl ? { uri: user.avatarUrl } : defaultProfile}
              style={{ width: 48, height: 48 }}
              resizeMode="cover"
            />
          </View>
        </View>
        {/* ── Row 1: Glow Level + Day Streak (combined) ── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{
            backgroundColor: GLASS.background,
            borderRadius: GLASS.borderRadius,
            borderWidth: GLASS.borderWidth,
            borderColor: GLASS.borderColor,
            padding: 16,
            marginBottom: CARD_GAP,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Left: Shield + Glow info + XP */}
          <ShieldBadge />
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
              {glowLevel.label}
            </Text>
            {/* XP bar */}
            <View
              style={{
                height: 5,
                borderRadius: 3,
                backgroundColor: ACCENT.ultraLight,
                overflow: "hidden",
                marginTop: 8,
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${Math.min(100, (glowLevel.xp / glowLevel.nextXp) * 100)}%`,
                  borderRadius: 3,
                  backgroundColor: ACCENT.primary,
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
              {glowLevel.xp.toLocaleString()} / {glowLevel.nextXp.toLocaleString()} XP
            </Text>
          </View>

          {/* Divider */}
          <View style={{ width: 1, height: 50, backgroundColor: "#F0F0F0" }} />

          {/* Right: Day Streak */}
          <View style={{ alignItems: "center", paddingHorizontal: 4 }}>
            <Image source={Fire} style={{ width: 22, height: 22 }} />
            <Text
              style={{
                fontSize: 26,
                fontFamily: "SFProRounded_Bold",
                color: "#1C1C1E",
                lineHeight: 30,
              }}
            >
              {streak}
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
        </Animated.View>

        {/* ── Row 2: Skin Health Score ── */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={{
            backgroundColor: GLASS.background,
            borderRadius: GLASS.borderRadius,
            borderWidth: GLASS.borderWidth,
            borderColor: GLASS.borderColor,
            padding: 18,
            marginBottom: CARD_GAP,
            flexDirection: "row",
            alignItems: "center",
            gap: 18,
          }}
        >
          <ScoreRing score={latestScore} size={120} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "SFProRounded_Semibold",
                  color: "#1C1C1E",
                }}
              >
                Skin Health Score
              </Text>
              <Pressable hitSlop={8} onPress={() => setActiveInfo("skinHealth")}>
                <Ionicons name="information-circle-outline" size={15} color="#AEAEB2" />
              </Pressable>
            </View>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "SFProRounded_Semibold",
                color: ACCENT.primary,
              }}
            >
              {scoreMessage} <Ionicons name="trophy-outline" size={14} color={ACCENT.primary} />
            </Text>
          </View>
        </Animated.View>

        {/* ── Row 3: Progress Over Time ── */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={{
            backgroundColor: GLASS.background,
            borderRadius: GLASS.borderRadius,
            borderWidth: GLASS.borderWidth,
            borderColor: GLASS.borderColor,
            padding: 16,
            marginBottom: CARD_GAP,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: "SFProRounded_Semibold",
                color: "#1C1C1E",
              }}
            >
              Progress Over Time
            </Text>

            {/* Scan range selector */}
            <View style={{ flexDirection: "row", gap: 4 }}>
              {(["5", "10", "all"] as const).map((range) => (
                <Pressable
                  key={range}
                  onPress={() => setScanRange(range)}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor:
                      scanRange === range ? ACCENT.ultraLight : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "SFProRounded_Semibold",
                      color: scanRange === range ? ACCENT.primary : "#AEAEB2",
                    }}
                  >
                    {range === "all" ? "All" : `Last ${range}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={{ flexDirection: "row", gap: 14, marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 14, height: 2.5, borderRadius: 1, backgroundColor: ACCENT.primary }} />
              <Text style={{ fontSize: 11, fontFamily: "SFProRounded_Medium", color: "#8E8E93" }}>
                Skin Score
              </Text>
            </View>
          </View>

          {/* Chart */}
          {chartData.actual.length >= 1 ? (
            <View style={{ marginLeft: -10, marginRight: -5 }}>
              <LineChart
                data={chartData.actual}
                width={SCREEN_WIDTH - CARD_PADDING * 2 - 60}
                height={140}
                spacing={
                  chartData.actual.length === 1
                    ? 0
                    : (SCREEN_WIDTH - CARD_PADDING * 2 - 80) / Math.max(chartData.actual.length - 1, 1)
                }
                initialSpacing={chartData.actual.length === 1 ? (SCREEN_WIDTH - CARD_PADDING * 2 - 60) / 2 : 10}
                endSpacing={10}
                color={ACCENT.primary}
                thickness={2.5}
                hideDataPoints={false}
                dataPointsColor={ACCENT.primary}
                dataPointsRadius={chartData.actual.length === 1 ? 6 : 3.5}
                textColor="#8E8E93"
                textFontSize={10}
                xAxisLabelTextStyle={{
                  fontSize: 9,
                  fontFamily: "SFProRounded_Medium",
                  color: "#AEAEB2",
                }}
                yAxisTextStyle={{
                  fontSize: 9,
                  fontFamily: "SFProRounded_Medium",
                  color: "#AEAEB2",
                }}
                maxValue={100}
                noOfSections={4}
                yAxisOffset={0}
                rulesColor="rgba(240,102,128,0.12)"
                rulesType="dashed"
                dashWidth={4}
                dashGap={4}
                xAxisColor="transparent"
                yAxisColor="transparent"
                areaChart={chartData.actual.length > 1}
                startFillColor="rgba(240,102,128,0.15)"
                endFillColor="rgba(240,102,128,0.01)"
                startOpacity={0.15}
                endOpacity={0.01}
                curved={chartData.actual.length > 2}
                showVerticalLines={false}
                focusEnabled
                showDataPointOnFocus
                showStripOnFocus
                stripColor="rgba(240,102,128,0.1)"
                stripWidth={1}
                focusedDataPointColor={ACCENT.primary}
                focusedDataPointRadius={6}
                showTextOnFocus
                unFocusOnPressOut
                delayBeforeUnFocus={2000}
              />
            </View>
          ) : (
            <View
              style={{
                height: 140,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "SFProRounded_Medium",
                  color: "#AEAEB2",
                  textAlign: "center",
                }}
              >
                Complete face scans to see your skin score progress
              </Text>
            </View>
          )}
        </Animated.View>

        {/* ── Row 3: Goal Estimation ── */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={{
            backgroundColor: GLASS.background,
            borderRadius: GLASS.borderRadius,
            borderWidth: GLASS.borderWidth,
            borderColor: GLASS.borderColor,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            marginBottom: CARD_GAP,
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: ACCENT.ultraLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="sparkles" size={22} color={ACCENT.primary} />
          </View>

          {/* Estimation text */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "SFProRounded_Medium",
                color: "#8E8E93",
              }}
            >
              Estimated to reach goal in
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontFamily: "SFProRounded_Bold",
                color: "#1C1C1E",
              }}
            >
              {weeksToGoal != null ? `${weeksToGoal} weeks` : "--"}
            </Text>
          </View>

          {/* Target */}
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "SFProRounded_Medium",
                color: "#8E8E93",
              }}
            >
              Target Score
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontFamily: "SFProRounded_Bold",
                color: "#1C1C1E",
              }}
            >
              {targetScore}
            </Text>
          </View>
        </Animated.View>

        {/* ── Row: Skin Balance Radar + Goal Progress ── */}
        {profile && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            style={{
              flexDirection: "row",
              gap: CARD_GAP,
              marginBottom: CARD_GAP,
            }}
          >
            {/* Skin Balance Radar */}
            <View
              style={{
                flex: 1,
                backgroundColor: GLASS.background,
                borderRadius: GLASS.borderRadius,
                borderWidth: GLASS.borderWidth,
                borderColor: GLASS.borderColor,
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "SFProRounded_Semibold",
                    color: "#1C1C1E",
                  }}
                >
                  Skin Balance Radar
                </Text>
                <Pressable hitSlop={8} onPress={() => setActiveInfo("skinRadar")}>
                  <Ionicons name="information-circle-outline" size={15} color="#AEAEB2" />
                </Pressable>
              </View>

              <RadarChart
                values={[
                  profile.hydration ?? 0,
                  profile.oilBalance ?? 0,
                  100 - (profile.sensitivity ?? 50),
                  profile.evenTone ?? 0,
                  profile.texture ?? 0,
                ]}
                labels={RADAR_LABELS}
                size={HALF_WIDTH - 40}
              />

              {/* Legend */}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 10, height: 2.5, borderRadius: 1, backgroundColor: ACCENT.primary }} />
                  <Text style={{ fontSize: 9, fontFamily: "SFProRounded_Medium", color: "#8E8E93" }}>You</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 10, height: 2.5, borderRadius: 1, backgroundColor: ACCENT.primary, opacity: 0.3 }} />
                  <Text style={{ fontSize: 9, fontFamily: "SFProRounded_Medium", color: "#8E8E93" }}>Ideal Range</Text>
                </View>
              </View>
            </View>

            {/* Goal Progress */}
            <View
              style={{
                flex: 1,
                backgroundColor: GLASS.background,
                borderRadius: GLASS.borderRadius,
                borderWidth: GLASS.borderWidth,
                borderColor: GLASS.borderColor,
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "SFProRounded_Semibold",
                    color: "#1C1C1E",
                  }}
                >
                  Goal Progress
                </Text>
                <Pressable hitSlop={8} onPress={() => setActiveInfo("goalProgress")}>
                  <Ionicons name="information-circle-outline" size={15} color="#AEAEB2" />
                </Pressable>
              </View>

              {/* Gem icon */}
              <View style={{ alignItems: "center", marginBottom: 14 }}>
                <GemIcon size={52} />
              </View>

              {/* Goal text */}
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "SFProRounded_Bold",
                  color: "#1C1C1E",
                  textAlign: "center",
                  marginBottom: 2,
                }}
              >
                {profile.concerns?.[0]
                  ? `Clear, Even & ${profile.concerns[0]}`
                  : "Clear, Even & Glowing Skin"}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "SFProRounded_Medium",
                  color: "#8E8E93",
                  textAlign: "center",
                  marginBottom: 14,
                }}
              >
                Your ultimate skin goal
              </Text>

              {/* Progress bar */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <View
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: ACCENT.ultraLight,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${latestScore}%`,
                      borderRadius: 4,
                      backgroundColor: ACCENT.primary,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "SFProRounded_Bold",
                    color: "#1C1C1E",
                  }}
                >
                  {latestScore}%
                </Text>
              </View>

              {/* Motivational text */}
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "SFProRounded_Semibold",
                  color: ACCENT.primary,
                  textAlign: "center",
                }}
              >
                {latestScore >= 75
                  ? "Almost there, keep glowing!"
                  : latestScore >= 50
                    ? "You're more than halfway there!"
                    : "Great start, keep going!"}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Row: Consistency + Top Improvements + Before vs Now ── */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={{
            flexDirection: "row",
            gap: CARD_GAP,
            marginBottom: CARD_GAP,
          }}
        >
          {/* Consistency */}
          <View
            style={{
              flex: 1,
              backgroundColor: GLASS.background,
              borderRadius: GLASS.borderRadius,
              borderWidth: GLASS.borderWidth,
              borderColor: GLASS.borderColor,
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontFamily: "SFProRounded_Semibold", color: "#1C1C1E" }}>
                Consistency
              </Text>
              <Pressable hitSlop={8} onPress={() => setActiveInfo("consistency")}>
                <Ionicons name="information-circle-outline" size={14} color="#AEAEB2" />
              </Pressable>
            </View>

            {/* Day headers */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 ,gap: 2}}>
              {DAYS_OF_WEEK.map((d, i) => (
                <Text key={i} style={{ fontSize: 10, fontFamily: "SFProRounded_Semibold", color: "#AEAEB2", width: 22, textAlign: "center" }}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Check circles - row 1 */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6,gap: 2 }}>
              {weekConsistency.map((item, i) => (
                <View
                  key={i}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: item.completed ? ACCENT.primary : item.partial ? "#FFD6A5" : "#F0F0F0",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.completed && (
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  )}
                  {item.partial && !item.completed && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF9500" }} />
                  )}
                </View>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontFamily: "SFProRounded_Semibold", color: ACCENT.primary, marginTop: 8 }}>
              {completedDays}/7 this week
            </Text>
          </View>

          {/* Top Improvements */}
          <View
            style={{
              flex: 1,
              backgroundColor: GLASS.background,
              borderRadius: GLASS.borderRadius,
              borderWidth: GLASS.borderWidth,
              borderColor: GLASS.borderColor,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: "SFProRounded_Semibold", color: "#1C1C1E", marginBottom: 14 }}>
              Top Improvements
            </Text>

            {topImprovements.length > 0 ? (
              topImprovements.map((item, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <Ionicons name={item.icon} size={18} color={ACCENT.primary} style={{ marginRight: 8 }} />
                  <Text style={{ flex: 1, fontSize: 12, fontFamily: "SFProRounded_Medium", color: "#1C1C1E" }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: "SFProRounded_Bold", color: "#34C759" }}>
                    +{item.change}%
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 11, fontFamily: "SFProRounded_Medium", color: "#AEAEB2" }}>
                Complete more scans to see improvements
              </Text>
            )}

            <Pressable style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              <Text style={{ fontSize: 12, fontFamily: "SFProRounded_Semibold", color: ACCENT.primary }}>
                View all
              </Text>
              <Ionicons name="chevron-forward" size={14} color={ACCENT.primary} />
            </Pressable>
          </View>

        </Animated.View>

        {/* ── Row: Before vs Now ── */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
          style={{
            backgroundColor: GLASS.background,
            borderRadius: GLASS.borderRadius,
            borderWidth: GLASS.borderWidth,
            borderColor: GLASS.borderColor,
            padding: 16,
            marginBottom: CARD_GAP,
          }}
        >
          <Text style={{ fontSize: 13, fontFamily: "SFProRounded_Semibold", color: "#1C1C1E", marginBottom: 10 }}>
            Before vs Now
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
            {/* Before photo */}
            <View style={{ flex: 1 }}>
              {firstScanPhoto ? (
                <Image
                  source={{ uri: firstScanPhoto }}
                  style={{ width: "100%", height: 120, borderRadius: 14, backgroundColor: "#f0f0f0" }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: "100%", height: 120, borderRadius: 14, backgroundColor: "#F5F0E8", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="image-outline" size={28} color="#CCBFA8" />
                </View>
              )}
              <Text style={{ fontSize: 11, fontFamily: "SFProRounded_Medium", color: "#AEAEB2", textAlign: "center", marginTop: 6 }}>
                {scores && scores.length > 0
                  ? formatDateLabel(
                      [...scores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date,
                    )
                  : "Start"}
              </Text>
            </View>

            {/* Now photo */}
            <View style={{ flex: 1 }}>
              {nowPhoto ? (
                <Image
                  source={{ uri: nowPhoto }}
                  style={{ width: "100%", height: 120, borderRadius: 14, backgroundColor: "#f0f0f0" }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: "100%", height: 120, borderRadius: 14, backgroundColor: "#E8F0E8", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="image-outline" size={28} color="#A8CCB0" />
                </View>
              )}
              <Text style={{ fontSize: 11, fontFamily: "SFProRounded_Medium", color: "#AEAEB2", textAlign: "center", marginTop: 6 }}>
                Today
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/skin-comparison-modal")}
            style={{
              backgroundColor: ACCENT.ultraLight,
              borderRadius: 10,
              paddingVertical: 8,
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: "SFProRounded_Semibold", color: ACCENT.primary }}>
              See full comparison
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── Row: AI Insight (opens full skin summary) ── */}
        <AnimatedTouchable
          entering={FadeInDown.delay(800).duration(500)}
          onPress={() => router.push("/skin-summary")}
          activeOpacity={0.85}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 13,
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            paddingVertical: 15,
            paddingHorizontal: 16,
            marginBottom: CARD_GAP,
            shadowColor: "#1C1C1E",
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: COLORS.primaryLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="sparkles" size={20} color={COLORS.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 15, fontFamily: "SFProRounded_Bold", color: "#1C1C1E" }}>
                AI Insight
              </Text>
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: COLORS.primaryLight,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: "SFProRounded_Bold",
                    color: COLORS.primaryDark,
                    letterSpacing: 0.4,
                  }}
                >
                  SUMMARY
                </Text>
              </View>
            </View>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 12.5,
                fontFamily: "SFProRounded_Medium",
                color: "#8E8E93",
                marginTop: 3,
                lineHeight: 17,
              }}
            >
              {aiInsight}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </AnimatedTouchable>
      </ScrollView>

      {/* Info Detail Modal */}
      <Modal
        visible={activeInfo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveInfo(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 32 }}
          onPress={() => setActiveInfo(null)}
        >
          <Pressable
            style={{
              backgroundColor: "#fff",
              borderRadius: 22,
              padding: 24,
              width: "100%",
              maxWidth: 340,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
            onPress={() => {}}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontFamily: "SFProRounded_Bold", color: "#1C1C1E", flex: 1 }}>
                {activeInfo ? INFO_DETAILS[activeInfo].title : ""}
              </Text>
              <Pressable hitSlop={8} onPress={() => setActiveInfo(null)}>
                <Ionicons name="close-circle" size={24} color="#AEAEB2" />
              </Pressable>
            </View>
            <Text style={{ fontSize: 14, fontFamily: "SFProRounded_Medium", color: "#636366", lineHeight: 21 }}>
              {activeInfo ? INFO_DETAILS[activeInfo].description : ""}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
