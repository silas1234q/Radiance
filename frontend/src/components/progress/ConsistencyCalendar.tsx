import React from 'react';
import { View, Text } from 'react-native';

interface ConsistencyCalendarProps {
  activeDays: number[];
  streak: number;
}

export default function ConsistencyCalendar({ activeDays, streak }: ConsistencyCalendarProps) {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <View className="bg-white rounded-xl p-5 shadow-sm mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-poppins-bold text-skin-text">Consistency</Text>
        <View className="px-3 py-1.5 rounded-full bg-primary-light">
          <Text className="text-[13px] font-poppins-semibold text-primary">🔥 {streak} day streak</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2 justify-start">
        {days.map((day) => (
          <View
            key={day}
            className={`w-8 h-8 rounded-full ${
              activeDays.includes(day) ? 'bg-primary' : 'bg-surface-alt'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
