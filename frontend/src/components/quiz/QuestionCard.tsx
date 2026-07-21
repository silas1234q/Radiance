import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

interface QuestionCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
}

export default function QuestionCard({ label, selected, onPress, multiSelect }: QuestionCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center justify-between py-4 px-[18px] rounded-lg border-[1.5px] ${
        selected ? 'border-primary bg-primary-light' : 'border-skin-border bg-surface'
      }`}
    >
      <Text className={`text-base font-poppins-semibold flex-1 ${selected ? 'text-primary' : 'text-skin-text'}`}>{label}</Text>
      <View
        className={`w-6 h-6 ${multiSelect ? 'rounded-[5px]' : 'rounded-full'} border-2 items-center justify-center ${
          selected ? 'bg-primary border-primary' : 'border-skin-border'
        }`}
      >
        {selected && (
          multiSelect
            ? <Text className="text-white text-[13px] font-poppins-bold">✓</Text>
            : <View className="w-[10px] h-[10px] rounded-full bg-white" />
        )}
      </View>
    </Pressable>
  );
}
