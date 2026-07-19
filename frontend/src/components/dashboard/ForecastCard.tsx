import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../../constants/theme';

interface ForecastCardProps {
  message?: string;
  onPress?: () => void;
}

export default function ForecastCard({ message, onPress }: ForecastCardProps) {
  return (
    <View style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 16 }}>
      <LinearGradient
        colors={GRADIENTS.forecast as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <Text className="text-lg font-poppins-bold text-white mb-2">Daily Skin Forecast</Text>
        <Text className="text-base font-poppins-medium leading-[22px] mb-4" style={{ color: 'rgba(255,255,255,0.9)' }}>
          {message || 'Your hydration levels are improving. Keep up the consistent routine for best results.'}
        </Text>
        {onPress && (
          <Pressable onPress={onPress} style={{ alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="text-[13px] font-poppins-semibold text-white">See what changed</Text>
          </Pressable>
        )}
      </LinearGradient>
    </View>
  );
}
