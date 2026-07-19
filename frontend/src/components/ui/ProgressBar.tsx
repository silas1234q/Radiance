import React from 'react';
import { View } from 'react-native';
import { COLORS } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  trackColor?: string;
}

export default function ProgressBar({ progress, color = COLORS.primary, height = 7, trackColor }: ProgressBarProps) {
  return (
    <View className="rounded-full overflow-hidden" style={{ height, backgroundColor: trackColor || COLORS.borderLight }}>
      <View
        className="rounded-full"
        style={{ width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color, height }}
      />
    </View>
  );
}
