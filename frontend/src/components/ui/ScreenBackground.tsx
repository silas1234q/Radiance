import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../../constants/theme';

interface ScreenBackgroundProps {
  children: React.ReactNode;
}

export default function ScreenBackground({ children }: ScreenBackgroundProps) {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={GRADIENTS.glassBg as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
