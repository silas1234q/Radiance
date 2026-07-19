import { useState, useEffect, useRef, useCallback } from 'react';
import type { CaptureState } from '../types/faceDetection';

const HOLD_DURATION = 1000;
const COUNTDOWN_TICK = 800;

interface UseAutoCaptureOptions {
  allPassed: boolean;
  onCapture: () => Promise<void>;
}

export function useAutoCapture({ allPassed, onCapture }: UseAutoCaptureOptions) {
  const [captureState, setCaptureState] = useState<CaptureState>('scanning');
  const [countdownNumber, setCountdownNumber] = useState(3);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, []);

  // Transition: scanning -> holding when all checks pass
  useEffect(() => {
    if (allPassed && captureState === 'scanning') {
      setCaptureState('holding');
    }
  }, [allPassed, captureState]);

  // Transition: holding -> countdown after HOLD_DURATION
  useEffect(() => {
    if (captureState !== 'holding') return;
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setCountdownNumber(3);
        setCaptureState('countdown');
      }
    }, HOLD_DURATION);
    return clearTimer;
  }, [captureState]);

  // Countdown ticks: 3 -> 2 -> 1 -> capturing
  useEffect(() => {
    if (captureState !== 'countdown') return;
    clearTimer();

    if (countdownNumber > 1) {
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setCountdownNumber((n) => n - 1);
        }
      }, COUNTDOWN_TICK);
    } else {
      // countdownNumber === 1, wait one more tick then capture
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setCaptureState('capturing');
        }
      }, COUNTDOWN_TICK);
    }
    return clearTimer;
  }, [captureState, countdownNumber]);

  // Transition: capturing -> call onCapture
  useEffect(() => {
    if (captureState !== 'capturing') return;
    onCapture().then(() => {
      if (mountedRef.current) {
        setCaptureState('frozen');
      }
    });
  }, [captureState, onCapture]);

  const reset = useCallback(() => {
    clearTimer();
    setCaptureState('scanning');
    setCountdownNumber(3);
  }, []);

  const setAnalyzing = useCallback(() => {
    setCaptureState('analyzing');
  }, []);

  return { captureState, countdownNumber, reset, setAnalyzing };
}
