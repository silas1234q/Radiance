import React from 'react';
import { TouchableOpacity, Platform, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface CircleIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  style?: ViewStyle;
}

/**
 * Floating circular icon button with a solid white background and a soft,
 * premium shadow. Used for the navigation back/close buttons across the app so
 * they all share one look and size.
 */
export default function CircleIconButton({
  icon,
  onPress,
  size = 40,
  iconSize = 22,
  iconColor = COLORS.text,
  style,
}: CircleIconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={8}
      activeOpacity={0.85}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          ...Platform.select({
            ios: {
              shadowColor: '#1C1C1E',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 14,
            },
            android: { elevation: 6 },
          }),
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}
