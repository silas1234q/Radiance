import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../../constants/theme';

interface MetricBarProps {
  label: string;
  value: number;
  color?: string;
}

export default function MetricBar({ label, value, color = COLORS.primary }: MetricBarProps) {
  return (
    <View className="mb-3.5">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-sm font-poppins-medium text-skin-text">{label}</Text>
        <Text className="text-sm font-poppins-semibold text-skin-text-secondary">{value}%</Text>
      </View>
      <View className="h-1.5 bg-skin-border-light rounded-full overflow-hidden">
        <View
          className="h-1.5 rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}
