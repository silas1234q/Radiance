import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { COLORS } from '../../constants/theme';
import GlassCard from '../ui/GlassCard';
import CircularProgress from '../ui/CircularProgress';

interface SkinScoreCardProps {
  score: number;
  skinAge?: number;
  trend?: 'up' | 'down' | 'stable';
  onRescan?: () => void;
}

export default function SkinScoreCard({ score, skinAge, trend, onRescan }: SkinScoreCardProps) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? COLORS.success : trend === 'down' ? COLORS.error : COLORS.textSecondary;

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      <View className="flex-row items-center gap-5">
        <CircularProgress score={score} size={100} strokeWidth={8} trackColor="rgba(0,0,0,0.06)" />
        <View className="flex-1 gap-2">
          <View className="flex-row items-center">
            <Text className="text-[15px] font-poppins-semibold" style={{ color: trendColor }}>{trendIcon} {trend || 'stable'}</Text>
          </View>
          {skinAge && (
            <Text className="text-sm font-poppins text-skin-text-secondary">Skin age: {skinAge}</Text>
          )}
          {onRescan && (
            <Pressable
              onPress={onRescan}
              style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' }}
            >
              <Text className="text-[13px] font-poppins-bold text-primary">Rescan</Text>
            </Pressable>
          )}
        </View>
      </View>
    </GlassCard>
  );
}
