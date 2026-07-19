import React from 'react';
import { Pressable, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface GlassIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  style?: ViewStyle;
}

export default function GlassIconButton({
  icon,
  onPress,
  size = 42,
  iconSize = 20,
  iconColor = COLORS.text,
  style,
}: GlassIconButtonProps) {
  const radius = size / 2;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          overflow: 'hidden',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.10,
              shadowRadius: 10,
            },
            android: { elevation: 4 },
          }),
        },
        style,
      ]}
    >
      <BlurView
        tint="light"
        intensity={50}
        experimentalBlurMethod="dimezisBlurView"
        style={[
          StyleSheet.absoluteFill,
          {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            borderRadius: radius,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.6)',
          },
        ]}
      >
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </BlurView>
    </Pressable>
  );
}
