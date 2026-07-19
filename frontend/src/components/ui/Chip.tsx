import React from 'react';
import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export default function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2.5 rounded-full border-[1.5px] ${
        selected
          ? 'bg-primary-light border-primary'
          : 'bg-surface-alt border-transparent'
      }`}
    >
      <Text
        className={`text-sm font-poppins-semibold ${
          selected ? 'text-primary' : 'text-skin-text'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
