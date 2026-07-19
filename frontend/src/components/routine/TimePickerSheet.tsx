import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

interface TimePickerSheetProps {
  onSelect: (time: 'morning' | 'evening') => void;
}

const OPTIONS: { label: string; value: 'morning' | 'evening'; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Morning', value: 'morning', icon: 'sunny-outline' },
  { label: 'Evening', value: 'evening', icon: 'moon-outline' },
];

const TimePickerSheet = forwardRef<BottomSheetModal, TimePickerSheetProps>(
  ({ onSelect }, ref) => {
    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      ),
      [],
    );

    const dismiss = useCallback(() => {
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [ref]);

    const snapPoints = useMemo(() => ['40%'], []);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleHidden}
        detached
        bottomInset={40}
        style={styles.sheet}
        backgroundStyle={styles.sheetBg}
      >
        <BottomSheetView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>When do you use it?</Text>
            <TouchableOpacity onPress={dismiss} hitSlop={10} style={styles.closeBtn} activeOpacity={0.6}>
              <Ionicons name="close" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Choose when this product fits in your routine</Text>

          {/* Options */}
          {OPTIONS.map((opt, i) => (
            <View
              key={opt.value}
              style={[styles.optionWrapper, i > 0 && { marginTop: SPACING.sm }]}
            >
              <TouchableOpacity
                onPress={() => { dismiss(); onSelect(opt.value); }}
                activeOpacity={0.6}
                style={styles.optionBtn}
              >
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: SPACING.sm,
  },
  sheetBg: {
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
  },
  handleHidden: {
    width: 0,
    height: 0,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 22,
    color: COLORS.text,
    ...FONTS.bold,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8E8ED',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    marginBottom: SPACING.lg,
    ...FONTS.regular,
  },
  optionWrapper: {
    backgroundColor: '#1C1C1E',
    borderRadius: RADIUS.md,
    overflow: 'hidden' as const,
  },
  optionBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  },
  optionLabel: {
    fontSize: 17,
    color: '#FFFFFF',
    ...FONTS.medium,
  },
});

export default TimePickerSheet;
