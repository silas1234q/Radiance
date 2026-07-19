import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { CheckStatus } from '../../types/faceDetection';

interface StatusPillBarProps {
  statuses: CheckStatus[];
}

function Pill({ status }: { status: CheckStatus }) {
  return (
    <Animated.View
      entering={status.passed ? FadeIn.duration(300) : undefined}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 5,
          backgroundColor: status.passed
            ? 'rgba(52, 199, 89, 0.9)'
            : 'rgba(28, 28, 30, 0.7)',
        },
      ]}
    >
      {status.passed && (
        <Text style={{ color: '#fff', fontSize: 11, marginRight: 3 }}>
          {'\u2713'}
        </Text>
      )}
      <Text
        style={{
          color: status.passed ? '#fff' : 'rgba(255,255,255,0.5)',
          fontSize: 11,
          fontFamily: 'SFProRounded_Semibold',
        }}
      >
        {status.label}
      </Text>
    </Animated.View>
  );
}

export function StatusPillBar({ statuses }: StatusPillBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 6,
        paddingHorizontal: 16,
      }}
    >
      {statuses.map((s) => (
        <Pill key={s.key} status={s} />
      ))}
    </View>
  );
}
