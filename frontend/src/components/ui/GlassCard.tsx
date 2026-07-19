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
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        },
        !noPadding && { padding: 20 },
        style,
      ]}
    >
      {children}
    </View>
  );
}
