import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ErrorScreen from '../components/ui/ErrorScreen';

/**
 * Navigable fatal-error route for non-crash catastrophic states
 * (e.g. core bootstrap / auth-sync failure). Render crashes are handled by the
 * root ErrorBoundary instead. Params: `?title=`, `?message=`.
 */
export default function CriticalErrorScreen() {
  const router = useRouter();
  const { title, message } = useLocalSearchParams<{ title?: string; message?: string }>();

  const handleRetry = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <ErrorScreen
      title={title || 'Something went wrong'}
      message={message || 'We could not load the app right now. Please try again.'}
      icon="cloud-offline"
      onRetry={handleRetry}
    />
  );
}
