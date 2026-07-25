import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

type Variant = 'error' | 'success' | 'info';

const VARIANTS: Record<Variant, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  error: { color: COLORS.error, icon: 'alert-circle' },
  success: { color: COLORS.success, icon: 'checkmark-circle' },
  info: { color: COLORS.primary, icon: 'information-circle' },
};

function ToastCard({ variant, text1, text2 }: { variant: Variant; text1?: string; text2?: string }) {
  const { color, icon } = VARIANTS[variant];
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={22} color={color} style={styles.icon} />
      <View style={styles.textWrap}>
        {!!text1 && (
          <Text style={styles.title} numberOfLines={1}>
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text style={styles.message} numberOfLines={3}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  error: (props: ToastConfigParams<unknown>) => (
    <ToastCard variant="error" text1={props.text1} text2={props.text2} />
  ),
  success: (props: ToastConfigParams<unknown>) => (
    <ToastCard variant="success" text1={props.text1} text2={props.text2} />
  ),
  info: (props: ToastConfigParams<unknown>) => (
    <ToastCard variant="info" text1={props.text1} text2={props.text2} />
  ),
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    ...FONTS.semibold,
    fontSize: 15,
    color: COLORS.text,
  },
  message: {
    ...FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
