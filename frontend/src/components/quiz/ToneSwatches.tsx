import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/theme';

const TONE_COLORS: Record<string, string> = {
  'Very fair': '#FDEBD0',
  Fair: '#F5CBA7',
  Medium: '#D4A574',
  Olive: '#C4A882',
  Brown: '#A0724A',
  'Dark brown': '#6B4226',
};

interface ToneSwatchesProps {
  options: string[];
  selected: string | null;
  onSelect: (tone: string) => void;
}

export default function ToneSwatches({ options, selected, onSelect }: ToneSwatchesProps) {
  return (
    <View className="flex-row flex-wrap justify-between mt-[26px]" style={{ gap: 16 }}>
      {options.map((tone) => {
        const isSelected = selected === tone;
        return (
          <Pressable
            key={tone}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(tone);
            }}
            style={{ width: '46%' }}
            className="items-center"
          >
            <View
              className="w-full rounded-2xl"
              style={{
                aspectRatio: 0.85,
                backgroundColor: TONE_COLORS[tone] || '#ccc',
                borderWidth: isSelected ? 3 : 0,
                borderColor: isSelected ? COLORS.primary : 'transparent',
              }}
            />
            <Text
              className={`text-sm mt-2 ${
                isSelected ? 'font-poppins-bold text-primary' : 'font-poppins-medium text-skin-text-secondary'
              }`}
            >
              {tone}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
