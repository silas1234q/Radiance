import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../ui/GlassCard';

const MOODS = [
  { label: 'Bad', icon: 'sad-outline' as const, color: '#FF6B6B' },
  { label: 'Meh', icon: 'remove-circle-outline' as const, color: '#FFB347' },
  { label: 'Okay', icon: 'ellipse-outline' as const, color: '#FFD700' },
  { label: 'Good', icon: 'happy-outline' as const, color: '#90EE90' },
  { label: 'Great', icon: 'sparkles' as const, color: '#34C759' },
];

interface MoodTrackerProps {
  selectedMood?: string;
  onSelectMood: (mood: string) => void;
}

export default function MoodTracker({ selectedMood, onSelectMood }: MoodTrackerProps) {
  return (
    <GlassCard style={{ marginBottom: 16 }}>
      <Text className="text-base font-poppins-bold text-skin-text mb-3.5">How's your skin feeling?</Text>
      <View className="flex-row justify-between gap-2">
        {MOODS.map(({ label, icon, color }) => {
          const isSelected = selectedMood === label;
          return (
            <Pressable
              key={label}
              onPress={() => onSelectMood(label)}
              className="flex-1 items-center py-3 rounded-lg gap-1"
              style={
                isSelected
                  ? { backgroundColor: color + '40', borderWidth: 1.5, borderColor: color }
                  : { backgroundColor: 'rgba(255,255,255,0.4)' }
              }
            >
              <Ionicons name={icon} size={24} color={isSelected ? color : '#999'} />
              <Text
                className={`text-[11px] font-poppins-semibold ${
                  isSelected ? 'text-skin-text' : 'text-skin-text-secondary'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}
