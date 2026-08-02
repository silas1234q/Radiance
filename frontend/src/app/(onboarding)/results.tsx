import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSkinProfile } from '../../hooks/queries/useProfile';
import { useRoutines } from '../../hooks/queries/useRoutines';
import { useAnalyzeSkin, useAnalyzeSkinWithScan } from '../../hooks/queries/useQuiz';
import type { PurchasesPackage } from 'react-native-purchases';
import { useRevenueCat, PAYWALL_RESULT } from '../../providers/RevenueCatProvider';
import { uploadSkinPhoto } from '../../api/uploadPhoto';
import CircularProgress from '../../components/ui/CircularProgress';
import ScanMetricsCard from '../../components/results/ScanMetricsCard';
import SkinVitalsCard, { type Vital } from '../../components/results/SkinVitalsCard';
import SubscribeGate from '../../components/results/SubscribeGate';
import ScanProcessing from '../../components/face-scan/ScanProcessing';
import Skeleton from '../../components/ui/Skeleton';
import { COLORS } from '../../constants/theme';
import { emitSessionExpired } from '../../lib/sessionExpiry';

const { height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.min(Math.round(SCREEN_H * 0.58), 560);

const METRIC_COLORS: Record<string, string> = {
  Hydration: '#4FC3F7',
  'Oil Balance': '#FFB74D',
  Texture: '#81C784',
  'Even Tone': '#BA68C8',
  Sensitivity: '#F06680',
};

// Vitals accent colors — mirror the Overall Metrics grid colors so the two
// sections read as the same system.
const VITAL_H = METRIC_COLORS['Hydration'];
const VITAL_O = METRIC_COLORS['Oil Balance'];
const VITAL_E = METRIC_COLORS['Even Tone'];

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

const hydrationLabel = (v: number) =>
  v >= 70 ? 'Well hydrated' : v >= 45 ? 'Moderately hydrated' : 'Dehydrated';
const oilBalanceLabel = (v: number) =>
  v >= 70 ? 'Well balanced' : v >= 45 ? 'Moderate' : 'Needs balancing';
const evenToneLabel = (v: number) =>
  v >= 70 ? 'Even & bright' : v >= 45 ? 'Mostly even' : 'Uneven tone';

// Plausible-looking teaser shown (heavily blurred) behind the subscribe gate,
// before the real analysis runs. Exact numbers are irrelevant — they're blurred.
const PLACEHOLDER_SCORE = 78;
const PLACEHOLDER_VITALS: Vital[] = [
  { key: 'H', label: 'Hydration', value: 64, subtitle: hydrationLabel(64), color: VITAL_H },
  { key: 'O', label: 'Oil Balance', value: 58, subtitle: oilBalanceLabel(58), color: VITAL_O },
  { key: 'E', label: 'Even Tone', value: 71, subtitle: evenToneLabel(71), color: VITAL_E },
];
const PLACEHOLDER_METRICS = [
  { label: 'Hydration', value: 64 },
  { label: 'Oil Balance', value: 58 },
  { label: 'Texture', value: 69 },
  { label: 'Even Tone', value: 71 },
  { label: 'Sensitivity', value: 52 },
];
const PLACEHOLDER_CONCERNS = ['Dryness', 'Uneven tone', 'Fine lines'];

function SkeletonLoading() {
  return (
    <View className="flex-1 bg-white items-center pt-10 px-5">
      <Skeleton width={180} height={180} borderRadius={90} />
      <View className="mt-6">
        <Skeleton width={140} height={14} borderRadius={7} />
      </View>
      <View className="flex-row justify-center gap-6 mt-8">
        <Skeleton width={68} height={68} borderRadius={34} />
        <Skeleton width={68} height={68} borderRadius={34} />
        <Skeleton width={68} height={68} borderRadius={34} />
      </View>
      <View className="w-full mt-8 gap-4">
        <Skeleton width={'100%' as unknown as number} height={16} borderRadius={8} />
        <Skeleton width={'80%' as unknown as number} height={16} borderRadius={8} />
        <Skeleton width={'90%' as unknown as number} height={16} borderRadius={8} />
      </View>
    </View>
  );
}

// --- Photo-forward hero ---
function Hero({ photoUrl, score }: { photoUrl: string | null; score: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ height: HERO_H, backgroundColor: '#111' }}>
      {photoUrl ? (
        <Image
          source={photoUrl}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="flex-1 items-center justify-center">
            <Text style={{ color: '#fff', fontSize: 64, fontFamily: 'SFProRounded_Bold' }}>{score}</Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 11,
                letterSpacing: 3,
                fontFamily: 'SFProRounded_Semibold',
              }}
            >
              YOUR SKIN SCORE
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* Top + bottom scrims for legibility and to blend into the vitals card */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.6)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO_H * 0.5 }}
        pointerEvents="none"
      />

      {/* Top bar */}
      <Animated.Text
        entering={FadeIn.duration(400)}
        style={{
          position: 'absolute',
          top: insets.top + 12,
          left: 20,
          color: 'rgba(255,255,255,0.9)',
          fontSize: 11,
          letterSpacing: 3,
          textTransform: 'uppercase',
          fontFamily: 'SFProRounded_Semibold',
        }}
      >
        Analysis Complete
      </Animated.Text>

      {photoUrl ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{
            position: 'absolute',
            top: insets.top + 6,
            right: 16,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontFamily: 'SFProRounded_Bold' }}>{score}</Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 11,
              marginLeft: 6,
              fontFamily: 'SFProRounded_Medium',
            }}
          >
            Skin Score
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

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

function MetricsGrid({ metrics }: { metrics: { label: string; value: number }[] }) {
  const firstRow = metrics.slice(0, 3);
  const secondRow = metrics.slice(3);

  return (
    <View className="gap-4">
      <View className="flex-row justify-between">
        {firstRow.map((m) => (
          <View key={m.label} className="items-center" style={{ width: 90 }}>
            <CircularProgress score={m.value} size={80} strokeWidth={5} color={METRIC_COLORS[m.label]} />
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
              <CircularProgress score={m.value} size={80} strokeWidth={5} color={METRIC_COLORS[m.label]} />
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
  const { error, locked, uri } = useLocalSearchParams<{
    error?: string;
    locked?: string;
    uri?: string;
  }>();
  const hasError = error === '1';
  const { data: profile, isLoading } = useSkinProfile();
  // Routines are Pro-only. When the skin was analyzed with the free (OpenAI
  // quiz-only) path, no routine is generated, so we send the user straight to
  // the dashboard instead of a routine they don't have.
  const { data: routines } = useRoutines();
  const hasRoutine = (routines?.length ?? 0) > 0;

  const { getToken } = useAuth();
  const { purchasePackage, isPro, isReady } = useRevenueCat();
  const analyze = useAnalyzeSkin();
  const analyzeWithScan = useAnalyzeSkinWithScan();
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isScanError, setIsScanError] = useState(false);
  // Which loader to show while unlocking: the branded scan-processing animation
  // (photo/YouCam analysis) vs. a simple loader (OpenAI quiz-only).
  const [scanLoader, setScanLoader] = useState(false);
  const showLocked = locked === '1' && !unlocked;
  // Local capture uri (if any) stays the hero photo throughout.
  const localPhoto = uri ?? null;

  // Runs the real analysis and unlocks: with a captured photo we upload it and
  // run the YouCam scan analysis; without one (scan skipped) we fall back to the
  // OpenAI quiz-only analysis. Shared by the purchase flow and the auto-unlock
  // for already-subscribed customers.
  const runAnalysisAndUnlock = useCallback(async () => {
    setUnlockError(null);
    setIsScanError(false);
    setScanLoader(!!localPhoto); // scan animation when there's a photo to analyze
    setUnlocking(true);
    try {
      if (localPhoto) {
        const token = await getToken();
        if (!token) { emitSessionExpired(); return; }
        const url = await uploadSkinPhoto(localPhoto, token);
        await analyzeWithScan.mutateAsync(url);
      } else {
        await analyze.mutateAsync({ buildRoutine: true });
      }
      setUnlocked(true);
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      setUnlockError(msg);
      if (err?.type === 'SCAN_ERROR') setIsScanError(true);
    } finally {
      setUnlocking(false);
    }
  }, [localPhoto, getToken, analyzeWithScan, analyze]);

  // "Get Radiance Pro": purchase the selected package (unless already Pro), then
  // run the analysis and unlock.
  const handleSubscribe = async (pkg: PurchasesPackage) => {
    if (unlocking || purchasing) return;
    setUnlockError(null);
    if (!isPro) {
      setPurchasing(true);
      const outcome = await purchasePackage(pkg);
      setPurchasing(false);
      if (!outcome.entitled) {
        // Stay quiet if the customer simply cancelled the purchase sheet.
        if (outcome.result !== PAYWALL_RESULT.CANCELLED)
          setUnlockError(outcome.message ?? 'Something went wrong. Please try again.');
        return;
      }
    }
    await runAnalysisAndUnlock();
  };

  // "Risk it": skip the (more accurate) YouCam scan analysis entirely and run
  // the free OpenAI quiz-only analysis, even when a photo was captured.
  const handleSkip = async () => {
    if (unlocking) return;
    setUnlockError(null);
    setScanLoader(false); // quiz-only OpenAI analysis → simple loader
    setUnlocking(true);
    try {
      // Free path: quiz-only analysis, no routine (routines are Pro-only).
      await analyze.mutateAsync({ buildRoutine: false });
      setUnlocked(true);
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      setUnlockError(msg);
    } finally {
      setUnlocking(false);
    }
  };

  // An already-subscribed customer should never see the paywall — once we know
  // their entitlement state, run the analysis and unlock automatically.
  const autoUnlockRef = useRef(false);
  useEffect(() => {
    if (locked === '1' && isReady && isPro && !unlocked && !autoUnlockRef.current) {
      autoUnlockRef.current = true;
      runAnalysisAndUnlock();
    }
  }, [locked, isReady, isPro, unlocked, runAnalysisAndUnlock]);

  if (showLocked) {
    // Wait until we know the entitlement state to avoid flashing the paywall.
    if (!isReady) {
      return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <SkeletonLoading />
        </SafeAreaView>
      );
    }
    // Already subscribed → skip the paywall; the auto-unlock effect runs the
    // analysis and this shows a loader (or a retry on error) instead.
    if (isPro) {
      return (
        <LockedResults
          photoUrl={localPhoto}
          hidePaywall
          onRetry={isScanError ? () => router.replace('/(onboarding)/face-scan') : runAnalysisAndUnlock}
          onSubscribe={handleSubscribe}
          onSkip={handleSkip}
          loading={!unlockError}
          errored={Boolean(unlockError)}
          errorMessage={unlockError}
          retryLabel={isScanError ? 'Retake Photo' : 'Try Again'}
          scanLoader={!!localPhoto}
        />
      );
    }
    return (
      <LockedResults
        photoUrl={localPhoto}
        onSubscribe={handleSubscribe}
        onSkip={handleSkip}
        loading={unlocking}
        purchasing={purchasing}
        errored={Boolean(unlockError)}
        errorMessage={unlockError}
        scanLoader={scanLoader}
      />
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <SkeletonLoading />
      </SafeAreaView>
    );
  }

  const score = profile?.skinScore ?? 0;
  const isQuizOnly = !profile?.analysisSource || profile.analysisSource === 'quiz_only' || profile.analysisSource === 'rule_based';
  const photoUrl = isQuizOnly ? null : (localPhoto ?? profile?.photoUrl ?? null);
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

  // Vitals mirror three of the canonical profile metrics shown in the Overall
  // Metrics grid, so the same concept always shows the same number.
  const hVal = profile?.hydration ?? 0;
  const oVal = profile?.oilBalance ?? 0;
  const eVal = profile?.evenTone ?? 0;
  const vitals: Vital[] = [
    { key: 'H', label: 'Hydration', value: hVal, subtitle: hydrationLabel(hVal), color: VITAL_H },
    { key: 'O', label: 'Oil Balance', value: oVal, subtitle: oilBalanceLabel(oVal), color: VITAL_O },
    { key: 'E', label: 'Even Tone', value: eVal, subtitle: evenToneLabel(eVal), color: VITAL_E },
  ];

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
    ...(hasScan && scanData!.skinType
      ? [
          scanData!.skinType!.tZone ? `T-Zone: ${scanData!.skinType!.tZone}` : null,
          scanData!.skinType!.uZone ? `U-Zone: ${scanData!.skinType!.uZone}` : null,
        ]
      : []),
  ].filter(Boolean) as string[];

  let cardIndex = 0;

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo hero */}
        <Hero photoUrl={photoUrl} score={score} />

        {/* Skin Analysis vitals card — overlaps the hero (scan-based only) */}
        {!isQuizOnly && (
          <View style={{ marginTop: -104, marginBottom: 18 }}>
            <SkinVitalsCard vitals={vitals} />
          </View>
        )}

        {/* Summary Card */}
        {summary && (
          <Card index={cardIndex++}>
            <SectionHeader title={isQuizOnly ? 'Skin Estimate' : 'Summary'} />
            <Text className="text-[15px] font-poppins-regular text-skin-text-secondary leading-[24px]">
              {summary}
            </Text>
            {isQuizOnly && (
              <View className="mt-4 px-3 py-2.5 rounded-xl bg-warning/[0.08]">
                <Text className="text-[12px] font-poppins-medium text-[#CC7A00] leading-[18px]">
                  This is an estimate based on your quiz answers. For a more accurate analysis, upgrade to Radiance Pro and use the face scan.
                </Text>
              </View>
            )}
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
            <ScanMetricsCard metrics={scanData!.metrics} explanations={scanMetricExplanations} />
          </Card>
        )}

        {/* Metrics Card (scan-based only) */}
        {!isQuizOnly && (
          <Card index={cardIndex++}>
            <SectionHeader title={hasScan ? 'Overall Metrics' : 'Skin Metrics'} />
            <MetricsGrid metrics={metrics} />
          </Card>
        )}

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

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(cardIndex * 120 + 200).duration(500)} className="px-5 pt-6">
          <Pressable
            onPress={() =>
              router.replace(hasError ? '/(onboarding)/quiz' : hasRoutine ? '/(tabs)' : '/(onboarding)/notifications')
            }
            className="h-[56px] rounded-2xl bg-primary items-center justify-center"
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Text className="text-[16px] font-poppins-semibold text-white tracking-[0.5px]">
              {hasError ? 'Try Again' : hasRoutine ? 'View My Routine' : 'Continue to Dashboard'}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// --- Locked (pre-subscription) results ---
// Hero photo stays crisp up top; a plausible teaser is blurred beneath it, and
// a premium subscribe sheet is anchored to the bottom. A full-screen loader
// covers the real analysis that runs on unlock (YouCam scan, or OpenAI if the
// scan was skipped).
function LockedResults({
  photoUrl,
  onSubscribe,
  onSkip,
  loading,
  purchasing = false,
  errored,
  hidePaywall = false,
  onRetry,
  scanLoader = false,
  errorMessage,
  retryLabel = 'Try Again',
}: {
  photoUrl: string | null;
  onSubscribe: (pkg: PurchasesPackage) => void;
  onSkip: () => void;
  loading: boolean;
  purchasing?: boolean;
  errored: boolean;
  hidePaywall?: boolean;
  onRetry?: () => void;
  scanLoader?: boolean;
  errorMessage?: string | null;
  retryLabel?: string;
}) {
  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.dark }}>
      <Hero photoUrl={photoUrl} score={PLACEHOLDER_SCORE} />

      {/* Blurred teaser fills the space below the hero */}
      <View style={{ flex: 1 }}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={{ marginTop: 18, marginBottom: 18 }}>
            <SkinVitalsCard vitals={PLACEHOLDER_VITALS} />
          </View>
          <Card index={0}>
            <SectionHeader title="Overall Metrics" />
            <MetricsGrid metrics={PLACEHOLDER_METRICS} />
          </Card>
          <Card index={1}>
            <SectionHeader title="Priority Concerns" />
            <View className="flex-row flex-wrap gap-2">
              {PLACEHOLDER_CONCERNS.map((concern) => (
                <View key={concern} className="px-4 py-[9px] rounded-xl bg-primary-light">
                  <Text className="text-[13px] font-poppins-semibold text-primary">{concern}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <BlurView intensity={44} tint="light" style={StyleSheet.absoluteFill} />
        {/* Dark gradient so the bottom sheet reads clearly over the teaser */}
        <LinearGradient
          colors={['rgba(13,13,18,0)', 'rgba(13,13,18,0.28)', 'rgba(13,13,18,0.72)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      {/* Bottom subscribe sheet — hidden for already-subscribed customers, who
          only see the loader (or a retry if the analysis failed). */}
      {hidePaywall ? (
        errored ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 24,
              paddingBottom: 44,
              alignItems: 'center',
            }}
          >
            <Text className="text-[14px] font-poppins-medium text-white text-center mb-4">
              {errorMessage || 'Something went wrong preparing your results.'}
            </Text>
            <Pressable
              onPress={onRetry}
              className="h-[52px] px-10 rounded-2xl bg-primary items-center justify-center"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <Text className="text-[15px] font-poppins-semibold text-white">{retryLabel}</Text>
            </Pressable>
          </View>
        ) : null
      ) : (
        <View style={StyleSheet.absoluteFill}>
          {errored && (
            <View
              className="self-center mb-3 px-4 py-2.5 rounded-2xl"
              style={{ position: 'absolute', top: 60, zIndex: 1, backgroundColor: 'rgba(255,255,255,0.95)' }}
            >
              <Text className="text-[13px] font-poppins-medium text-primary text-center">
                {errorMessage || 'Something went wrong. Please try again.'}
              </Text>
            </View>
          )}
          <SubscribeGate onSubscribe={onSubscribe} onSkip={onSkip} loading={loading || purchasing} />
        </View>
      )}

      {/* Full-screen loader while the real analysis runs. A scan analysis keeps
          the branded scan-processing animation going (seamless from the scan);
          the quick OpenAI quiz-only path shows a simple loader. */}
      {loading &&
        (scanLoader && photoUrl ? (
          <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}>
            <ScanProcessing uri={photoUrl} />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="mt-4 text-[15px] font-poppins-medium text-skin-text">
              Analyzing your skin…
            </Text>
          </Animated.View>
        ))}
    </View>
  );
}
