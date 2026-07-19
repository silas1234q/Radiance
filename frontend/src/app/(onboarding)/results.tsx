import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
  runOnJS,
} from 'react-native-reanimated';
import { useSkinProfile } from '../../hooks/queries/useProfile';
import CircularProgress from '../../components/ui/CircularProgress';
import ScanMetricsCard from '../../components/results/ScanMetricsCard';
import Skeleton from '../../components/ui/Skeleton';
import { COLORS } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const METRIC_COLORS: Record<string, string> = {
  Hydration: '#4FC3F7',
  'Oil Balance': '#FFB74D',
  Texture: '#81C784',
  'Even Tone': '#BA68C8',
  Sensitivity: '#F06680',
};

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

function SkeletonLoading() {
  return (
    <View className="flex-1 bg-white items-center pt-10 px-5">
      {/* Hero ring skeleton */}
      <Skeleton width={180} height={180} borderRadius={90} />
      {/* Label placeholder */}
      <View className="mt-6">
        <Skeleton width={140} height={14} borderRadius={7} />
      </View>
      {/* Scan metric rings row */}
      <View className="flex-row justify-center gap-6 mt-8">
        <Skeleton width={68} height={68} borderRadius={34} />
        <Skeleton width={68} height={68} borderRadius={34} />
        <Skeleton width={68} height={68} borderRadius={34} />
      </View>
      {/* Metric rings row */}
      <View className="flex-row justify-center gap-6 mt-4">
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width={80} height={80} borderRadius={40} />
      </View>
      {/* Text blocks */}
      <View className="w-full mt-8 gap-4">
        <Skeleton width={'100%' as unknown as number} height={16} borderRadius={8} />
        <Skeleton width={'80%' as unknown as number} height={16} borderRadius={8} />
        <Skeleton width={'90%' as unknown as number} height={16} borderRadius={8} />
      </View>
    </View>
  );
}

// --- Hero Score Ring (animated) ---
function HeroScoreRing({ score }: { score: number }) {
  const size = 200;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedOffset = useSharedValue(circumference);
  const animatedScore = useSharedValue(0);

  useEffect(() => {
    const target = circumference - (score / 100) * circumference;
    animatedOffset.value = withTiming(target, { duration: 1200, easing: Easing.out(Easing.cubic) });
    animatedScore.value = withTiming(score, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [score]);

  const [displayScore, setDisplayScore] = useState(0);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  useAnimatedReaction(
    () => Math.round(animatedScore.value),
    (val) => { runOnJS(setDisplayScore)(val); },
  );

  return (
    <Animated.View entering={FadeIn.duration(600)} className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F2F2F7"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-[48px] font-poppins-bold text-skin-text tracking-[-2px]">
          {displayScore}
        </Text>
        <Text className="text-[11px] font-poppins-medium text-skin-text-tertiary tracking-[2px] uppercase -mt-1">
          Your Skin Score
        </Text>
      </View>
    </Animated.View>
  );
}

// --- Premium Card ---
function Card({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 120).duration(500).springify()}
      className="mx-5 mb-4 px-5 py-5 bg-white rounded-[20px]"
      style={CARD_SHADOW}
    >
      {children}
    </Animated.View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-[11px] font-poppins-semibold text-skin-text-tertiary tracking-[2px] uppercase mb-4">
      {title}
    </Text>
  );
}

// --- Face Zone Row ---
function FaceZoneRow({ zone, issues }: { zone: string; issues: string[] }) {
  return (
    <View className="flex-row items-start py-[14px]">
      <Text className="text-[15px] font-poppins-semibold text-skin-text w-[90px]">
        {zone.charAt(0).toUpperCase() + zone.slice(1)}
      </Text>
      <View className="flex-1 flex-row flex-wrap gap-1.5">
        {issues.map((issue) => (
          <View key={issue} className="px-2.5 py-[5px] rounded-full bg-[#F9F0F2]">
            <Text className="text-[12px] font-poppins-medium text-primary-dark">{issue}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionDivider() {
  return <View className="h-[1px] bg-skin-border-light" />;
}

// --- Metrics Grid ---
function MetricsGrid({ metrics }: { metrics: { label: string; value: number }[] }) {
  const firstRow = metrics.slice(0, 3);
  const secondRow = metrics.slice(3);

  return (
    <View className="gap-4">
      <View className="flex-row justify-between">
        {firstRow.map((m) => (
          <View key={m.label} className="items-center" style={{ width: 90 }}>
            <CircularProgress
              score={m.value}
              size={80}
              strokeWidth={5}
              color={METRIC_COLORS[m.label]}
            />
            <Text className="text-[11px] font-poppins-medium text-skin-text-secondary mt-2 text-center">
              {m.label}
            </Text>
          </View>
        ))}
      </View>
      {secondRow.length > 0 && (
        <View className="flex-row justify-center gap-6">
          {secondRow.map((m) => (
            <View key={m.label} className="items-center" style={{ width: 90 }}>
              <CircularProgress
                score={m.value}
                size={80}
                strokeWidth={5}
                color={METRIC_COLORS[m.label]}
              />
              <Text className="text-[11px] font-poppins-medium text-skin-text-secondary mt-2 text-center">
                {m.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// --- Main Screen ---
export default function ResultsScreen() {
  const router = useRouter();
  const { data: profile, isLoading } = useSkinProfile();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <SkeletonLoading />
      </SafeAreaView>
    );
  }

  const score = profile?.skinScore ?? 0;
  const faceMap = (profile?.faceMapIssues as Record<string, string[]>) ?? {};
  const aiRaw = profile?.aiAnalysisRaw as {
    summary?: string;
    scanMetricExplanations?: {
      acne: string; wrinkle: string; ageSpot: string; redness: string;
      pore: string; oiliness: string; texture: string; moisture: string;
    } | null;
  } | null;
  const summary = aiRaw?.summary;
  const scanMetricExplanations = aiRaw?.scanMetricExplanations ?? null;
  const allergies = (profile?.allergies as string[]) ?? [];
  const concerns = (profile?.concerns as string[]) ?? [];
  const faceMapEntries = Object.entries(faceMap).filter(
    ([, issues]) => (issues as string[]).length > 0
  );

  const scanData = profile?.scanData as {
    metrics: {
      acne: { rawScore: number; uiScore: number };
      wrinkle: { rawScore: number; uiScore: number };
      ageSpot: { rawScore: number; uiScore: number };
      redness: { rawScore: number; uiScore: number };
      pore: { rawScore: number; uiScore: number };
      oiliness: { rawScore: number; uiScore: number };
      texture: { rawScore: number; uiScore: number };
      moisture: { rawScore: number; uiScore: number };
    };
    skinType?: { whole: string; tZone: string; uZone: string };
  } | null | undefined;
  const hasScan = !!scanData?.metrics;

  const metrics = [
    { label: 'Hydration', value: profile?.hydration ?? 0 },
    { label: 'Oil Balance', value: profile?.oilBalance ?? 0 },
    { label: 'Texture', value: profile?.texture ?? 0 },
    { label: 'Even Tone', value: profile?.evenTone ?? 0 },
    { label: 'Sensitivity', value: profile?.sensitivity ?? 0 },
  ];

  const traits = [
    profile?.skinType,
    profile?.sensitivityLevel,
    profile?.skinTone ? `${profile.skinTone} tone` : null,
    profile?.skinAge ? `Skin age ${profile.skinAge}` : null,
    ...(hasScan && scanData.skinType
      ? [
          scanData.skinType.tZone ? `T-Zone: ${scanData.skinType.tZone}` : null,
          scanData.skinType.uZone ? `U-Zone: ${scanData.skinType.uZone}` : null,
        ]
      : []),
  ].filter(Boolean) as string[];

  let cardIndex = 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Label */}
        <Animated.View entering={FadeIn.duration(400)} className="items-center pt-6 pb-2">
          <Text className="text-[11px] font-poppins-semibold text-skin-text-tertiary tracking-[3px] uppercase">
            Analysis Complete
          </Text>
        </Animated.View>

        {/* Hero Score Ring */}
        <View className="items-center pt-4 pb-8">
          <HeroScoreRing score={score} />
        </View>

        {/* Summary Card */}
        {summary && (
          <Card index={cardIndex++}>
            <SectionHeader title="Summary" />
            <Text className="text-[15px] font-poppins-regular text-skin-text-secondary leading-[24px]">
              {summary}
            </Text>
          </Card>
        )}

        {/* Traits Card */}
        {traits.length > 0 && (
          <Card index={cardIndex++}>
            <SectionHeader title="Your Skin Profile" />
            <View className="flex-row flex-wrap gap-2">
              {traits.map((trait) => (
                <View key={trait} className="px-4 py-[7px] rounded-full border border-skin-border">
                  <Text className="text-[13px] font-poppins-medium text-skin-text">{trait}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Scan Analysis Card */}
        {hasScan && (
          <Card index={cardIndex++}>
            <SectionHeader title="Scan Analysis" />
            <ScanMetricsCard metrics={scanData.metrics} explanations={scanMetricExplanations} />
          </Card>
        )}

        {/* Metrics Card */}
        <Card index={cardIndex++}>
          <SectionHeader title={hasScan ? 'Overall Metrics' : 'Skin Metrics'} />
          <MetricsGrid metrics={metrics} />
        </Card>

        {/* Concerns Card */}
        {concerns.length > 0 && (
          <Card index={cardIndex++}>
            <SectionHeader title="Priority Concerns" />
            <View className="flex-row flex-wrap gap-2">
              {concerns.map((concern) => (
                <View key={concern} className="px-4 py-[9px] rounded-xl bg-primary-light">
                  <Text className="text-[13px] font-poppins-semibold text-primary">{concern}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Face Map Card */}
        {faceMapEntries.length > 0 && (
          <Card index={cardIndex++}>
            <SectionHeader title="Face Map" />
            {faceMapEntries.map(([zone, issues], i) => (
              <React.Fragment key={zone}>
                <FaceZoneRow zone={zone} issues={issues as string[]} />
                {i < faceMapEntries.length - 1 && <SectionDivider />}
              </React.Fragment>
            ))}
          </Card>
        )}

        {/* Sensitivities Card */}
        {allergies.length > 0 && (
          <Card index={cardIndex++}>
            <SectionHeader title="Sensitivities" />
            <View className="flex-row flex-wrap gap-2">
              {allergies.map((allergy) => (
                <View key={allergy} className="px-4 py-[9px] rounded-xl border border-warning/30 bg-warning/[0.06]">
                  <Text className="text-[13px] font-poppins-medium text-[#CC7A00]">{allergy}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Upgrade Card */}
        {(!profile?.analysisSource || profile.analysisSource === 'quiz_only' || profile.analysisSource === 'rule_based') && (
          <Card index={cardIndex++}>
            <SectionHeader title="Upgrade Your Analysis" />
            <Text className="text-[14px] font-poppins-regular text-skin-text-secondary leading-[22px] mb-5">
              Your results are based on quiz answers alone. A face scan can measure your skin directly for more accurate scores.
            </Text>
            <View className="gap-3 mb-5">
              {[
                'Precise hydration & oiliness readings',
                'Real pore size and texture measurement',
                'Better-matched product recommendations',
              ].map((item) => (
                <View key={item} className="flex-row items-start">
                  <View className="w-[5px] h-[5px] rounded-full bg-primary mt-[7px] mr-3" />
                  <Text className="flex-1 text-[14px] font-poppins-medium text-skin-text leading-[20px]">{item}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => router.push('/(onboarding)/face-scan')}
              className="h-[48px] rounded-2xl bg-primary items-center justify-center"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <Text className="text-[14px] font-poppins-semibold text-white tracking-[0.3px]">
                Scan My Face
              </Text>
            </Pressable>
          </Card>
        )}

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(cardIndex * 120 + 200).duration(500)} className="px-5 pt-6">
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            className="h-[56px] rounded-2xl bg-primary items-center justify-center"
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Text className="text-[16px] font-poppins-semibold text-white tracking-[0.5px]">View My Routine</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
