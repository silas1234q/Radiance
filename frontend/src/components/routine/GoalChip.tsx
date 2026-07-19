import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated as RNAnimated } from 'react-native';
import { COLORS } from '../../constants/theme';

interface GoalChipProps {
  goals: string[];
  onPress?: () => void;
}

export default function GoalChip({ goals, onPress }: GoalChipProps) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    if (goals.length <= 1) return;
    const interval = setInterval(() => {
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setIndex((prev) => (prev + 1) % goals.length);
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [goals.length]);

  const current = goals[index] ?? '';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed && onPress ? 0.7 : 1 })}>
      <View
        className="flex-row items-center px-3 py-1.5 rounded-full"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.7)',
          gap: 4,
        }}
      >
        <RNAnimated.Text
          className="text-[13px] font-poppins-medium"
          style={{ color: COLORS.textSecondary, opacity: fadeAnim }}
          numberOfLines={1}
        >
          {current}
        </RNAnimated.Text>
        {goals.length > 1 && (
          <Text
            className="text-[11px] font-poppins-medium"
            style={{ color: COLORS.textTertiary }}
          >
            +{goals.length - 1}
          </Text>
        )}
        <Text className="text-[13px] font-poppins-bold" style={{ color: COLORS.primary }}>
          Goal
        </Text>
      </View>
    </Pressable>
  );
}
