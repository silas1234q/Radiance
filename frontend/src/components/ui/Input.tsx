import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { COLORS } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
}

export default function Input({ label, style, ...props }: InputProps) {
  return (
    <View>
      {label && (
        <Text className="text-sm font-poppins-semibold text-skin-text mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className="h-[52px] border-[1.5px] border-skin-border rounded-md bg-surface px-4 text-[17px] text-skin-text"
        placeholderTextColor={COLORS.textTertiary}
        style={style}
        {...props}
      />
    </View>
  );
}
