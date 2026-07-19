import React from 'react';
import { View, Text } from 'react-native';
import type { FaceChecks, CaptureState } from '../../types/faceDetection';

interface InstructionBubbleProps {
  checks: FaceChecks;
  captureState: CaptureState;
  countdownNumber: number;
}

function getMessage(checks: FaceChecks, captureState: CaptureState, countdown: number): string {
  if (captureState === 'countdown') return `${countdown}`;
  if (captureState === 'holding') return 'Hold still...';
  if (captureState === 'capturing' || captureState === 'frozen') return 'Perfect!';

  if (!checks.faceDetected) return 'Position your face in the frame';
  if (!checks.centered) return 'Center your face';
  if (!checks.distance) return 'Adjust your distance';
  if (!checks.headPose) return 'Look straight ahead';
  if (!checks.lighting) return 'Find better lighting';
  if (!checks.focus) return 'Hold steady';

  return 'Perfect!';
}

export function InstructionBubble({ checks, captureState, countdownNumber }: InstructionBubbleProps) {
  const message = getMessage(checks, captureState, countdownNumber);
  const isCountdown = captureState === 'countdown';

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          borderRadius: 999,
          paddingHorizontal: isCountdown ? 24 : 20,
          paddingVertical: isCountdown ? 10 : 8,
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: isCountdown ? 18 : 14,
            fontFamily: 'SFProRounded_Semibold',
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}
