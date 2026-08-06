import React from 'react';
import { View, Text, Image } from 'react-native';
import GlassCard from '../ui/GlassCard';
import Skeleton from '../ui/Skeleton';
import { COLORS } from '../../constants/theme';
import type { GamificationSummary } from '../../types/api';
import Fire from '@/src/assets/images/fire.png';

const CARD_STYLE = {
  marginBottom: 16,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
} as const;

/**
 * Streak + XP card for the home screen.
 *
 * This used to be inlined behind `{gamification && …}`, so any moment the query
 * had no data — first paint before `/gamification` resolves, a cache wipe, an
 * error with a cold cache — the card silently vanished and the layout collapsed.
 * It now always renders: real values when we have them, a same-shaped skeleton
 * when we don't.
 */
export default function StreakCard({
  gamification,
}: {
  gamification?: GamificationSummary;
}) {
  if (!gamification) {
    return (
      <GlassCard style={CARD_STYLE}>
        <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
          <Skeleton width={28} height={28} borderRadius={14} />
          <Skeleton width={36} height={28} borderRadius={8} />
          <Skeleton width={60} height={10} borderRadius={5} />
        </View>
        <View style={{ width: 1, height: 50, backgroundColor: '#F0F0F0' }} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width={80} height={12} borderRadius={6} />
          <Skeleton width={120} height={18} borderRadius={8} />
          <Skeleton width="100%" height={5} borderRadius={3} />
          <Skeleton width={100} height={10} borderRadius={5} />
        </View>
      </GlassCard>
    );
  }

  const glowLevel = gamification.glowLevel;
  const xpProgress = glowLevel
    ? glowLevel.levelMaxXp > glowLevel.levelMinXp
      ? ((glowLevel.currentXp - glowLevel.levelMinXp) /
          (glowLevel.levelMaxXp - glowLevel.levelMinXp)) *
        100
      : 100
    : 0;

  return (
    <GlassCard style={CARD_STYLE}>
      {/* Streak */}
      <View style={{ alignItems: 'center', paddingHorizontal: 4 }}>
        <Image source={Fire} style={{ width: 30, height: 30 }} />
        <Text
          style={{
            fontSize: 28,
            fontFamily: 'SFProRounded_Bold',
            color: '#1C1C1E',
            lineHeight: 32,
          }}
        >
          {gamification.currentStreak}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'SFProRounded_Semibold',
            color: '#8E8E93',
          }}
        >
          Day Streak
        </Text>
      </View>

      {/* Divider */}
      <View style={{ width: 1, height: 50, backgroundColor: '#F0F0F0' }} />

      {/* XP + Glow Level */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'SFProRounded_Medium',
            color: '#8E8E93',
          }}
        >
          Glow Level
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'SFProRounded_Bold',
            color: '#1C1C1E',
          }}
        >
          {glowLevel?.label ?? 'Seedling'}
        </Text>
        <View
          style={{
            height: 5,
            borderRadius: 3,
            backgroundColor: '#FFE0E6',
            overflow: 'hidden',
            marginTop: 8,
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${Math.min(100, xpProgress)}%`,
              borderRadius: 3,
              backgroundColor: COLORS.primary,
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'SFProRounded_Medium',
            color: '#AEAEB2',
            marginTop: 4,
          }}
        >
          {gamification.totalXp.toLocaleString()} /{' '}
          {(glowLevel?.levelMaxXp ?? 500).toLocaleString()} XP
        </Text>
      </View>
    </GlassCard>
  );
}
