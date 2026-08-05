import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useDetailedInsight } from '../../hooks/queries/useRoutines';
import CircleIconButton from '../../components/ui/CircleIconButton';
import { COLORS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RING_SIZE = 160;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function ScoreRing({ score, size = RING_SIZE }: { score: number; size?: number }) {
  const strokeWidth = size === RING_SIZE ? RING_STROKE : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: score,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    let current = 0;
    const step = Math.max(1, Math.round(score / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, score);
      setDisplayScore(current);
      if (current >= score) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [score]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const ringColor = score >= 70 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.error;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor + '20'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: size === RING_SIZE ? 36 : 18, fontFamily: 'SFProRounded_Bold', color: COLORS.text }}>
          {displayScore}
        </Text>
        {size === RING_SIZE && (
          <Text style={{ fontSize: 12, fontFamily: 'SFProRounded_Medium', color: COLORS.textSecondary, marginTop: -4 }}>
            out of 100
          </Text>
        )}
      </View>
    </View>
  );
}

function CategoryBar({ category, score, tip }: { category: string; score: number; tip: string }) {
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: score,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const barColor = score >= 70 ? COLORS.success : score >= 50 ? COLORS.warning : score > 0 ? COLORS.error : COLORS.border;

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 14, fontFamily: 'SFProRounded_Medium', color: COLORS.text }}>{category}</Text>
        <Text style={{ fontSize: 13, fontFamily: 'SFProRounded_Semibold', color: barColor }}>{score}%</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceAlt, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 4,
            backgroundColor: barColor,
            width: animWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
      <Text style={{ fontSize: 11, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary, marginTop: 4 }}>
        {tip}
      </Text>
    </View>
  );
}

const PRIORITY_CONFIG = {
  high: { color: COLORS.error, bg: COLORS.error + '12', label: 'High' },
  medium: { color: COLORS.warning, bg: COLORS.warning + '12', label: 'Medium' },
  low: { color: COLORS.success, bg: COLORS.success + '12', label: 'Low' },
};

export default function RoutineInsightScreen() {
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const { data, isLoading } = useDetailedInsight(routineId);

  if (isLoading || !data) {
    return (
      <View className="flex-1 bg-gray-200">
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ fontSize: 15, fontFamily: 'SFProRounded_Medium', color: COLORS.textSecondary }}>
              Analyzing your routine...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const { compatibilityScore, summary, categoryScores, improvements, comments } = data;

  return (
    <View className="flex-1 bg-gray-200">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="relative items-center justify-center mt-2 mb-5" style={{ height: 44 }}>
            <Text className="text-[20px] tracking-[-0.4px] text-skin-text" style={{ fontWeight: '600' }}>
              Routine Insight
            </Text>
            <View className="absolute left-0">
              <CircleIconButton icon="chevron-back" onPress={() => router.back()} />
            </View>
          </View>

          {/* Score Ring Card */}
          <LinearGradient
            colors={['#FFF5F0', '#FFF0F3', '#F9F0FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 }}
          >
            <Text style={{ fontSize: 13, fontFamily: 'SFProRounded_Medium', color: COLORS.textSecondary, marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
              Compatibility Score
            </Text>
            <ScoreRing score={compatibilityScore} />
            <Text style={{ fontSize: 14, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 21, paddingHorizontal: 8 }}>
              {summary}
            </Text>
          </LinearGradient>

          {/* Category Breakdown */}
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Semibold', color: COLORS.text, marginBottom: 16 }}>
              Category Breakdown
            </Text>
            {categoryScores.map((cat) => (
              <CategoryBar key={cat.category} category={cat.category} score={cat.score} tip={cat.tip} />
            ))}
          </View>

          {/* Improvements */}
          {improvements.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Semibold', color: COLORS.text, marginBottom: 14 }}>
                Where to Improve
              </Text>
              {improvements.map((item, i: number) => {
                const config = PRIORITY_CONFIG[item.priority];
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                      marginBottom: i < improvements.length - 1 ? 14 : 0,
                    }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: config.bg, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      <Ionicons
                        name={item.priority === 'high' ? 'alert-circle' : item.priority === 'medium' ? 'warning' : 'bulb-outline'}
                        size={16}
                        color={config.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <Text style={{ fontSize: 14, fontFamily: 'SFProRounded_Semibold', color: COLORS.text }}>
                          {item.area}
                        </Text>
                        <View style={{ backgroundColor: config.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 10, fontFamily: 'SFProRounded_Semibold', color: config.color }}>
                            {config.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 13, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary, lineHeight: 19 }}>
                        {item.suggestion}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Expert Comments */}
          {comments.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.primary} />
                <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Semibold', color: COLORS.text }}>
                  Expert Notes
                </Text>
              </View>
              {comments.map((comment: string, i: number) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: i < comments.length - 1 ? 12 : 0,
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 7 }} />
                  <Text style={{ fontSize: 13, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary, lineHeight: 20, flex: 1 }}>
                    {comment}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Mini rings row */}
          {categoryScores.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Semibold', color: COLORS.text, marginBottom: 16 }}>
                At a Glance
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 16 }}>
                {categoryScores.map((cat) => (
                  <View key={cat.category} style={{ alignItems: 'center', width: (SCREEN_WIDTH - 80) / 3 }}>
                    <ScoreRing score={cat.score} size={64} />
                    <Text style={{ fontSize: 11, fontFamily: 'SFProRounded_Medium', color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' }}>
                      {cat.category}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
