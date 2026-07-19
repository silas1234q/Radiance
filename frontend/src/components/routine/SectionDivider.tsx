import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../../constants/theme';

interface SectionDividerProps {
  label: string;
}

export default function SectionDivider({ label }: SectionDividerProps) {
  return (
    <View className="flex-row items-center my-5">
      <View className="flex-1 h-[0.5px]" style={{ backgroundColor: COLORS.borderLight }} />
      <Text
        className="mx-4 text-[13px]"
        style={{ color: COLORS.textTertiary, fontWeight: '500' }}
      >
        {label}
      </Text>
      <View className="flex-1 h-[0.5px]" style={{ backgroundColor: COLORS.borderLight }} />
    </View>
  );
}
