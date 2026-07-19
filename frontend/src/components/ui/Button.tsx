import React from 'react';
import { Pressable, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'dark';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary shadow-primary shadow-lg elevation-8',
  secondary: 'bg-surface-alt',
  outline: 'bg-transparent border-[1.5px] border-skin-border',
  dark: 'bg-black',
};

const textVariantClasses: Record<string, string> = {
  primary: 'text-white',
  secondary: 'text-skin-text',
  outline: 'text-skin-text',
  dark: 'text-white',
};

export default function Button({ title, onPress, variant = 'primary', disabled, loading, style, textStyle }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-[54px] rounded-lg items-center justify-center ${variantClasses[variant]} ${disabled ? 'opacity-50' : ''}`}
      style={({ pressed }) => [pressed && { opacity: 0.85 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} />
      ) : (
        <Text
          className={`text-lg font-poppins-bold ${textVariantClasses[variant]}`}
          style={textStyle}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
