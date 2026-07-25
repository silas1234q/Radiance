import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = SCREEN_WIDTH * 0.72;
const CARD_H = CARD_W * 1.25;
const RADIUS = 28;

// Progress badge geometry.
const GLOW = 230;
const BADGE = 132;
const RING_SW = 6;
const RING_R = (BADGE - RING_SW) / 2;
const RING_C = 2 * Math.PI * RING_R;

const STEPS = [
  'Reading your skin from the scan',
  'Measuring pores & texture',
  'Identifying key concerns',
  'Building your routine',
];

/**
 * Post-capture "analyzing" screen: the captured photo held in the viewfinder
 * frame with a scan line sweeping over it, a glowing circular progress badge
 * counting up, and a rotating status line beneath. Purely presentational —
 * the percentage is a smooth faux-progress; the parent navigates away on
 * completion.
 */
export default function ScanProcessing({ uri }: { uri: string }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [pct, setPct] = useState(0);

  const enter = useSharedValue(0); // 0..1 entrance
  const sweep = useSharedValue(0); // 0..1 scan-line travel
  const progress = useSharedValue(0); // 0..1 faux analysis progress
  const lastMilestone = useRef(0);

  useEffect(() => {
    enter.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.back(1.4)) });
    sweep.value = withDelay(
      200,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
    // Ease toward ~96% over the expected analysis window; parent unmounts on done.
    progress.value = withTiming(0.96, { duration: 16000, easing: Easing.out(Easing.quad) });
    // Gentle tap as the analyzing screen settles in.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
      // Subtle tick as each status step rotates.
      Haptics.selectionAsync();
    }, 2400);
    return () => clearInterval(id);
  }, []);

  // Light tap each time the percentage crosses a 25% milestone.
  useEffect(() => {
    const m = Math.floor(pct / 25) * 25;
    if (m > lastMilestone.current) {
      lastMilestone.current = m;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [pct]);

  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (v, prev) => {
      if (v !== prev) runOnJS(setPct)(v);
    },
  );

  const stageStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { scale: interpolate(enter.value, [0, 1], [0.9, 1]) },
      { translateY: interpolate(enter.value, [0, 1], [16, 0]) },
    ],
  }));

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(sweep.value, [0, 1], [0, CARD_H]) }],
    opacity: interpolate(sweep.value, [0, 0.08, 0.92, 1], [0, 1, 1, 0]),
  }));

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_C * (1 - progress.value),
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.stage, stageStyle]}>
        {/* Photo */}
        <View style={styles.card}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

          {/* Sweeping scan line */}
          <Animated.View style={[styles.sweep, lineStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(240,102,128,0.30)', 'transparent']}
              style={{ position: 'absolute', left: 0, right: 0, top: -64, height: 128 }}
            />
            <View style={styles.scanCore} />
            <View style={styles.scanCoreGlow} />
          </Animated.View>
        </View>

        {/* Progress badge, overlapping the card's bottom edge */}
        <View style={styles.badgeWrap} pointerEvents="none">
          {/* Soft radial glow */}
          <Svg width={GLOW} height={GLOW} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.5} />
                <Stop offset="42%" stopColor="#C79CFF" stopOpacity={0.3} />
                <Stop offset="72%" stopColor="#7FC8FF" stopOpacity={0.16} />
                <Stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#glow)" />
          </Svg>

          {/* Badge face */}
          <View style={styles.badge}>
            <Svg width={BADGE} height={BADGE} style={StyleSheet.absoluteFill}>
              <Circle
                cx={BADGE / 2}
                cy={BADGE / 2}
                r={RING_R}
                fill="none"
                stroke="rgba(240,102,128,0.16)"
                strokeWidth={RING_SW}
              />
              <AnimatedCircle
                cx={BADGE / 2}
                cy={BADGE / 2}
                r={RING_R}
                fill="none"
                stroke={COLORS.primary}
                strokeWidth={RING_SW}
                strokeLinecap="round"
                strokeDasharray={`${RING_C}`}
                animatedProps={ringProps}
                transform={`rotate(-90 ${BADGE / 2} ${BADGE / 2})`}
              />
            </Svg>
            <View style={styles.badgeInner}>
              <Text style={styles.pct}>{pct}%</Text>
              <Text style={styles.analyzing}>Analyzing…</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Status */}
      <Animated.Text key={stepIndex} entering={FadeInDown.duration(420)} style={styles.statusText}>
        {STEPS[stepIndex]}
      </Animated.Text>
      <ScanDots />
    </View>
  );
}

/** Three sequentially pulsing dots. */
function ScanDots() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(3, { duration: 1200, easing: Easing.linear }), -1, false);
  }, []);
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} t={t} />
      ))}
    </View>
  );
}

function Dot({ index, t }: { index: number; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const d = (((t.value - index) % 3) + 3) % 3;
    const on = d < 1 ? 1 - d : 0;
    return { opacity: 0.3 + on * 0.7, transform: [{ scale: 0.85 + on * 0.35 }] };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  stage: { width: CARD_W, height: CARD_H, alignItems: 'center' },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
  },
  sweep: { position: 'absolute', left: 0, right: 0 },
  scanCore: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  scanCoreGlow: {
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    height: 3.5,
    backgroundColor: 'rgba(240,102,128,0.5)',
  },
  badgeWrap: {
    position: 'absolute',
    // Center the badge on the card's bottom edge (half overlap).
    bottom: -GLOW / 2,
    width: GLOW,
    height: GLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  badgeInner: { alignItems: 'center', justifyContent: 'center' },
  pct: { color: COLORS.text, fontSize: 34, fontFamily: 'SFProRounded_Bold', letterSpacing: -0.5 },
  analyzing: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: 'SFProRounded_Semibold',
    marginTop: 2,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: 'SFProRounded_Bold',
    letterSpacing: 0.1,
    textAlign: 'center',
    // Clear the half of the badge that overhangs below the card.
    marginTop: BADGE / 2 + 30,
    marginBottom: 14,
    paddingHorizontal: 32,
  },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary },
});
