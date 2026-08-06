import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeOut } from 'react-native-reanimated';
import Skeleton from '../ui/Skeleton';
import { GLASS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_PADDING = 20;

// Mirrors the card chrome on the Analysis screen so the swap-in is seamless.
const CARD = {
  backgroundColor: GLASS.background,
  borderRadius: GLASS.borderRadius,
  borderWidth: GLASS.borderWidth,
  borderColor: GLASS.borderColor,
  padding: 16,
  marginBottom: CARD_GAP,
} as const;

const HALF = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

export default function ProgressSkeleton() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }} edges={['top']}>
      <Animated.View exiting={FadeOut.duration(300)} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: CARD_PADDING,
            paddingTop: 10,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          {/* Header: "Analysis" + subtitle, avatar on the right */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <View style={{ gap: 8 }}>
              <Skeleton width={140} height={30} borderRadius={8} />
              <Skeleton width={120} height={14} borderRadius={7} />
            </View>
            <Skeleton width={48} height={48} borderRadius={24} />
          </View>

          {/* Glow Level + Day Streak */}
          <View style={[CARD, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
            <Skeleton width={44} height={52} borderRadius={12} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width={80} height={12} borderRadius={6} />
              <Skeleton width={120} height={18} borderRadius={8} />
              <Skeleton width="100%" height={5} borderRadius={3} />
            </View>
            <View style={{ width: 1, height: 50, backgroundColor: '#F0F0F0' }} />
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Skeleton width={28} height={28} borderRadius={14} />
              <Skeleton width={36} height={24} borderRadius={8} />
            </View>
          </View>

          {/* Skin Health Score (ring + copy) */}
          <View
            style={[CARD, { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18 }]}
          >
            <Skeleton width={120} height={120} borderRadius={60} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width={130} height={15} borderRadius={7} />
              <Skeleton width={110} height={14} borderRadius={7} />
            </View>
          </View>

          {/* Progress Over Time (chart) */}
          <View style={CARD}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Skeleton width={150} height={16} borderRadius={8} />
              <Skeleton width={90} height={26} borderRadius={13} />
            </View>
            <Skeleton width="100%" height={160} borderRadius={12} />
          </View>

          {/* Goal Estimation */}
          <View style={[CARD, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="70%" height={15} borderRadius={7} />
              <Skeleton width="45%" height={12} borderRadius={6} />
            </View>
          </View>

          {/* Skin Balance Radar + Goal Progress */}
          <View style={{ flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP }}>
            <View style={[CARD, { width: HALF, marginBottom: 0, gap: 12 }]}>
              <Skeleton width={110} height={14} borderRadius={7} />
              <Skeleton width={HALF - 32} height={HALF - 32} borderRadius={(HALF - 32) / 2} />
              <Skeleton width="80%" height={10} borderRadius={5} />
            </View>
            <View style={[CARD, { width: HALF, marginBottom: 0, gap: 12 }]}>
              <Skeleton width={100} height={14} borderRadius={7} />
              <Skeleton width={40} height={40} borderRadius={12} />
              <Skeleton width="90%" height={12} borderRadius={6} />
              <Skeleton width="100%" height={8} borderRadius={4} />
              <Skeleton width="60%" height={10} borderRadius={5} />
            </View>
          </View>

          {/* Consistency + Top Improvements */}
          <View style={{ flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP }}>
            <View style={[CARD, { width: HALF, marginBottom: 0, gap: 12 }]}>
              <Skeleton width={100} height={14} borderRadius={7} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} width={22} height={22} borderRadius={11} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} width={22} height={22} borderRadius={11} />
                ))}
              </View>
            </View>
            <View style={[CARD, { width: HALF, marginBottom: 0, gap: 12 }]}>
              <Skeleton width={120} height={14} borderRadius={7} />
              <Skeleton width="100%" height={12} borderRadius={6} />
              <Skeleton width="85%" height={12} borderRadius={6} />
              <Skeleton width="70%" height={12} borderRadius={6} />
            </View>
          </View>

          {/* Before vs Now */}
          <View style={CARD}>
            <Skeleton width={120} height={16} borderRadius={8} />
            <View style={{ flexDirection: 'row', gap: CARD_GAP, marginTop: 12 }}>
              <Skeleton width={HALF - 20} height={140} borderRadius={12} />
              <Skeleton width={HALF - 20} height={140} borderRadius={12} />
            </View>
          </View>

          {/* AI Insight */}
          <View style={[CARD, { gap: 10 }]}>
            <Skeleton width={110} height={14} borderRadius={7} />
            <Skeleton width="100%" height={12} borderRadius={6} />
            <Skeleton width="92%" height={12} borderRadius={6} />
            <Skeleton width="60%" height={12} borderRadius={6} />
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
