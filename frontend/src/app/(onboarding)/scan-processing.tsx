import React, { useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScanProcessing from '../../components/face-scan/ScanProcessing';

// How long the simulated "analysis" runs before revealing the (locked) results.
// Long enough to feel like real work, short enough not to bore.
const SIMULATED_DURATION_MS = 5500;

/**
 * Post-capture screen for the face-scan path. Purely theatrical: it shows the
 * captured photo in the analyzing UI for a fixed beat, then routes to the
 * locked results screen. No upload or analysis happens here — the real
 * (quiz-only) analysis is deferred until the user unlocks results.
 */
export default function ScanProcessingScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !uri) return;
    done.current = true;

    const timer = setTimeout(() => {
      router.replace(
        `/(onboarding)/results?locked=1&uri=${encodeURIComponent(uri)}`,
      );
    }, SIMULATED_DURATION_MS);

    return () => clearTimeout(timer);
  }, [uri]);

  if (!uri) return null;
  return <ScanProcessing uri={uri} />;
}
