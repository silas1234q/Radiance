import { useState, useEffect, useRef, useCallback } from 'react';
import type { FaceChecks, CheckStatus } from '../types/faceDetection';

const CHECK_KEYS: (keyof FaceChecks)[] = [
  'faceDetected',
  'centered',
  'distance',
  'headPose',
  'lighting',
  'focus',
];

const CHECK_LABELS: Record<keyof FaceChecks, string> = {
  faceDetected: 'Face',
  centered: 'Center',
  distance: 'Distance',
  headPose: 'Angle',
  lighting: 'Lighting',
  focus: 'Focus',
};

const DELAYS = [800, 600, 700, 500, 600, 500];

const initialChecks: FaceChecks = {
  faceDetected: false,
  centered: false,
  distance: false,
  headPose: false,
  lighting: false,
  focus: false,
};

export function useSimulatedFaceChecks(active: boolean) {
  const [checks, setChecks] = useState<FaceChecks>({ ...initialChecks });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const startSequence = useCallback(() => {
    clearTimers();
    setChecks({ ...initialChecks });

    let cumulative = 0;
    CHECK_KEYS.forEach((key, i) => {
      // Add slight randomness: delay +/- 100ms
      cumulative += DELAYS[i] + (Math.random() * 200 - 100);
      const timer = setTimeout(() => {
        setChecks((prev) => ({ ...prev, [key]: true }));
      }, cumulative);
      timersRef.current.push(timer);
    });
  }, []);

  useEffect(() => {
    if (active) {
      startSequence();
    } else {
      clearTimers();
      setChecks({ ...initialChecks });
    }
    return clearTimers;
  }, [active, startSequence]);

  const reset = useCallback(() => {
    clearTimers();
    setChecks({ ...initialChecks });
    // Restart after a brief pause
    const t = setTimeout(() => startSequence(), 300);
    timersRef.current.push(t);
  }, [startSequence]);

  const checkStatuses: CheckStatus[] = CHECK_KEYS.map((key) => ({
    key,
    label: CHECK_LABELS[key],
    passed: checks[key],
  }));

  const allPassed = CHECK_KEYS.every((key) => checks[key]);

  return { checks, checkStatuses, allPassed, reset };
}
