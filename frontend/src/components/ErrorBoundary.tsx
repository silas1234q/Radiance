import React from 'react';
import ErrorScreen from './ui/ErrorScreen';
import { getErrorMessage } from '../lib/errors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Root error boundary. Catches render crashes anywhere in the tree and shows the
 * full-screen ErrorScreen fallback instead of a white screen / redbox.
 * "Try again" clears the boundary state to re-mount the subtree.
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface in dev; a crash-reporting service could hook in here later.
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorScreen
          title="The app hit a snag"
          message={getErrorMessage(
            this.state.error,
            'An unexpected error occurred. Please try again.',
          )}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
