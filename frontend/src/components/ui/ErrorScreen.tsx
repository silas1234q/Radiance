import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from './ScreenBackground';
import Button from './Button';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  /** Icon glyph; defaults to a warning icon. Use 'cloud-offline' for network errors. */
  icon?: keyof typeof Ionicons.glyphMap;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Full-screen, on-brand error view. Used both as the ErrorBoundary fallback
 * (render crashes) and by the `critical-error` route (fatal non-crash states).
 * Intentionally self-contained — no navigation, since the router may be broken
 * during a crash.
 */
export default function ErrorScreen({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  icon = 'alert-circle',
  onRetry,
  retryLabel = 'Try again',
}: ErrorScreenProps) {
  return (
    <ScreenBackground>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={56} color={COLORS.error} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <Button title={retryLabel} onPress={onRetry} style={styles.button} />
        )}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconWrap: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...FONTS.bold,
    fontSize: 22,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    ...FONTS.regular,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  button: {
    alignSelf: 'stretch',
  },
});
