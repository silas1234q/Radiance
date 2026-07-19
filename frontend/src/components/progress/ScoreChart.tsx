import React from 'react';
import { View, Text } from 'react-native';

interface ScoreChartProps {
  scores: { score: number; week: number }[];
}

export default function ScoreChart({ scores }: ScoreChartProps) {
  const maxScore = 100;
  const displayScores = scores.slice(0, 7).reverse();

  return (
    <View className="bg-white rounded-xl p-5 shadow-sm mb-4">
      <Text className="text-lg font-poppins-bold text-skin-text mb-5">Score Trend</Text>
      <View className="flex-row justify-around items-end h-40 gap-2">
        {displayScores.map((item, index) => {
          const height = (item.score / maxScore) * 120;
          return (
            <View key={index} className="items-center flex-1">
              <Text className="text-[11px] font-poppins-semibold text-skin-text-secondary mb-1">{item.score}</Text>
              <View className="w-7 rounded-sm bg-primary min-h-[8px]" style={{ height }} />
              <Text className="text-[10px] font-poppins-medium text-skin-text-tertiary mt-1.5">W{item.week}</Text>
            </View>
          );
        })}
        {displayScores.length === 0 && (
          <Text className="text-sm font-poppins text-skin-text-secondary text-center flex-1">Complete a skin scan to see your score trend</Text>
        )}
      </View>
    </View>
  );
}
