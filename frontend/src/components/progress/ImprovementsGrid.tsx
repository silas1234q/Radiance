import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../../constants/theme';

interface Improvement {
  label: string;
  change: number;
  unit?: string;
}

interface ImprovementsGridProps {
  improvements: Improvement[];
}

export default function ImprovementsGrid({ improvements }: ImprovementsGridProps) {
  return (
    <View className="bg-white rounded-xl p-5 shadow-sm mb-4">
      <Text className="text-lg font-poppins-bold text-skin-text mb-4">Improvements</Text>
      <View className="flex-row flex-wrap gap-3">
        {improvements.map((item) => {
          const isPositive = item.change > 0;
          return (
            <View key={item.label} className="w-[47%] bg-surface rounded-lg p-4 items-center">
              <Text
                className="text-2xl font-poppins-extrabold"
                style={{ color: isPositive ? COLORS.success : COLORS.primary }}
              >
                {isPositive ? '+' : ''}{item.change}%
              </Text>
              <Text className="text-[13px] font-poppins-medium text-skin-text-secondary mt-1">{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
