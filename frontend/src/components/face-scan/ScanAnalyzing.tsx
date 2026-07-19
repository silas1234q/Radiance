import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = [
  'Reading your scan...',
  'Detecting facial landmarks...',
  'Measuring hydration & texture...',
  'Mapping face zones...',
  'Combining with quiz answers...',
];

const PHOTO_SIZE = 150;
const STAGE_SIZE = 260;
const SCAN_LINE_H = 44;
const BAR_WIDTH = SCREEN_WIDTH - 100;

// Face-mesh landmark positions as fractions of the photo
const LANDMARKS = [
  { x: 0.5, y: 0.18 },  // forehead
  { x: 0.32, y: 0.4 },  // left eye
  { x: 0.68, y: 0.4 },  // right eye
  { x: 0.5, y: 0.55 },  // nose
  { x: 0.28, y: 0.64 }, // left cheek
  { x: 0.72, y: 0.64 }, // right cheek
  { x: 0.5, y: 0.76 },  // mouth
  { x: 0.5, y: 0.9 },   // chin
];

// Index pairs into LANDMARKS forming the mesh
const MESH_LINES: [number, number][] = [
  [0, 1], [0, 2], [1, 2], [1, 3], [2, 3],
  [3, 4], [3, 5], [3, 6], [4, 6], [5, 6], [6, 7],
];

const PARTICLES = [
  { radius: 108, size: 8, duration: 4200, color: '#4FC3F7', startAngle: 0, direction: 1 },
  { radius: 118, size: 6, duration: 6400, color: '#FFB74D', startAngle: 140, direction: -1 },
  { radius: 100, size: 5, duration: 5200, color: '#BA68C8', startAngle: 250, direction: 1 },
  { radius: 126, size: 7, duration: 7600, color: COLORS.primary, startAngle: 70, direction: -1 },
  { radius: 112, size: 4, duration: 3600, color: '#81C784', startAngle: 200, direction: 1 },
];

function SweepArc({
  size,
  arcFraction,
  duration,
  direction,
  strokeWidth,
  opacity,
}: {
  size: number;
  arcFraction: number;
  duration: number;
  direction: 1 | -1;
  strokeWidth: number;
  opacity: number;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360 * direction, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={COLORS.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference * arcFraction} ${circumference}`}
          opacity={opacity}
        />
      </Svg>
    </Animated.View>
  );
}

function OrbitingParticle({
  radius,
  size,
  duration,
  color,
  startAngle,
  direction,
}: (typeof PARTICLES)[number]) {
  const rotation = useSharedValue(startAngle);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(startAngle + 360 * direction, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: radius * 2, height: radius * 2, alignItems: 'center' },
        style,
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.6,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </Animated.View>
  );
}

function LandmarkDot({ x, y, delay }: { x: number; y: number; delay: number }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300, easing: Easing.out(Easing.back(2)) }),
          withTiming(1, { duration: 800 }),
          withTiming(0, { duration: 300 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: x - 4,
          top: y - 4,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#fff',
          borderWidth: 1.5,
          borderColor: COLORS.primary,
        },
        style,
      ]}
    />
  );
}

export function ScanAnalyzing({ photoUri }: { photoUri: string | null }) {
  const [stepIndex, setStepIndex] = useState(0);

  const contentOpacity = useSharedValue(0);
  const photoScale = useSharedValue(0.85);
  const scanLineY = useSharedValue(-SCAN_LINE_H);
  const meshOpacity = useSharedValue(0);
  const stepOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const shimmerX = useSharedValue(-80);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    photoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) });

    // Photo breathes gently once settled
    photoScale.value = withDelay(700, withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    ));

    // Scan line sweeps down the photo, pauses, repeats
    scanLineY.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(PHOTO_SIZE, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(-SCAN_LINE_H, { duration: 0 }),
        withTiming(-SCAN_LINE_H, { duration: 400 })
      ),
      -1,
      false
    ));

    // Face mesh fades in and out like detection passes
    meshOpacity.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.cubic) })
      ),
      -1,
      true
    ));

    stepOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    progressWidth.value = withTiming(0.9, {
      duration: 20000,
      easing: Easing.out(Easing.quad),
    });

    // Shimmer highlight sliding along the progress bar
    shimmerX.value = withRepeat(
      withSequence(
        withTiming(BAR_WIDTH, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(-80, { duration: 0 }),
        withTiming(-80, { duration: 600 })
      ),
      -1,
      false
    );
  }, []);

  // Cycle through step messages
  useEffect(() => {
    const interval = setInterval(() => {
      stepOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(setStepIndex)((prev: number) => (prev + 1) % STEPS.length);
        stepOpacity.value = withTiming(1, { duration: 400 });
      });
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const photoStyle = useAnimatedStyle(() => ({ transform: [{ scale: photoScale.value }] }));
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));
  const meshStyle = useAnimatedStyle(() => ({ opacity: meshOpacity.value }));
  const stepTextStyle = useAnimatedStyle(() => ({ opacity: stepOpacity.value }));
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as `${number}%`,
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Animated.View style={containerStyle} className="items-center">
        {/* Stage: arcs + particles + photo */}
        <View
          className="items-center justify-center mb-12"
          style={{ width: STAGE_SIZE, height: STAGE_SIZE }}
        >
          {/* Radar sweep arcs */}
          <SweepArc size={200} arcFraction={0.28} duration={2400} direction={1} strokeWidth={3} opacity={0.85} />
          <SweepArc size={232} arcFraction={0.18} duration={3800} direction={-1} strokeWidth={2} opacity={0.4} />

          {/* Orbiting data particles */}
          {PARTICLES.map((p, i) => (
            <OrbitingParticle key={i} {...p} />
          ))}

          {/* Captured photo */}
          <Animated.View
            style={[
              photoStyle,
              {
                width: PHOTO_SIZE,
                height: PHOTO_SIZE,
                borderRadius: PHOTO_SIZE / 2,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: COLORS.primaryLight,
                backgroundColor: COLORS.surface,
                shadowColor: COLORS.primary,
                shadowOpacity: 0.25,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              },
            ]}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <View
                  style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary }}
                />
              </View>
            )}

            {/* Face mesh lines */}
            <Animated.View
              pointerEvents="none"
              style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }, meshStyle]}
            >
              <Svg width={PHOTO_SIZE} height={PHOTO_SIZE}>
                {MESH_LINES.map(([a, b], i) => (
                  <Line
                    key={i}
                    x1={LANDMARKS[a].x * PHOTO_SIZE}
                    y1={LANDMARKS[a].y * PHOTO_SIZE}
                    x2={LANDMARKS[b].x * PHOTO_SIZE}
                    y2={LANDMARKS[b].y * PHOTO_SIZE}
                    stroke="#fff"
                    strokeWidth={1}
                    opacity={0.55}
                  />
                ))}
              </Svg>
            </Animated.View>

            {/* Landmark dots popping in and out */}
            {LANDMARKS.map((lm, i) => (
              <LandmarkDot
                key={i}
                x={lm.x * PHOTO_SIZE}
                y={lm.y * PHOTO_SIZE}
                delay={i * 220}
              />
            ))}

            {/* Scan line */}
            <Animated.View
              pointerEvents="none"
              style={[
                scanLineStyle,
                { position: 'absolute', left: 0, right: 0, top: 0, height: SCAN_LINE_H },
              ]}
            >
              <LinearGradient
                colors={['rgba(240,102,128,0)', 'rgba(240,102,128,0.45)', 'rgba(240,102,128,0)']}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Title */}
        <Text className="text-[24px] font-poppins-extrabold text-skin-text tracking-[-0.4px] mb-2.5">
          Analyzing your skin
        </Text>

        {/* Rotating step text */}
        <Animated.Text
          style={stepTextStyle}
          className="text-[15px] font-poppins text-skin-text-secondary text-center leading-[21px] mb-8"
        >
          {STEPS[stepIndex]}
        </Animated.Text>

        {/* Progress bar with shimmer */}
        <View
          style={{
            width: BAR_WIDTH,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLORS.primaryLight,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              progressBarStyle,
              { height: 4, borderRadius: 2, backgroundColor: COLORS.primary },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[shimmerStyle, { position: 'absolute', top: 0, bottom: 0, width: 80 }]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}
