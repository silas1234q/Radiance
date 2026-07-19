import React from 'react';
import { Text } from 'react-native';
import GlassCard from '../ui/GlassCard';
import ProgressBar from '../ui/ProgressBar';

interface RoutineProgressCardProps {
  completedSteps: number;
  totalSteps: number;
}

export default function RoutineProgressCard({ completedSteps, totalSteps }: RoutineProgressCardProps) {
  const progress = totalSteps > 0 ? completedSteps / totalSteps : 0;

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      <Text className="text-base font-poppins-bold text-skin-text mb-3">Today's Routine</Text>
      <ProgressBar progress={progress} trackColor="rgba(0,0,0,0.06)" />
      <Text className="text-sm font-poppins text-skin-text-secondary mt-2">
        {completedSteps} of {totalSteps} steps completed
      </Text>
    </GlassCard>
  );
}
