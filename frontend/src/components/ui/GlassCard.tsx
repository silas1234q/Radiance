import React from 'react';
import { View, ViewStyle } from 'react-native';
import { GLASS } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  intensity?: number;
}

export default function GlassCard({ children, style, noPadding }: GlassCardProps) {
  return (
    <View
      style={[
        {
          borderRadius: GLASS.borderRadius,
          backgroundColor: GLASS.background,
          borderWidth: GLASS.borderWidth,
          borderColor: GLASS.borderColor,
        },
        !noPadding && { padding: 20 },
        style,
      ]}
    >
      {children}
    </View>
  );
}
