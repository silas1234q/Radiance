import React, { forwardRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

export interface ActionMenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  destructive?: boolean;
  background?: string;
  iconColor?: string;
  textColor?: string;
  onPress: () => void;
}

export type ActionMenuGroup = ActionMenuItem[];

interface ActionMenuProps {
  title: string;
  subtitle?: string;
  groups: ActionMenuGroup[];
}

const ActionMenu = forwardRef<BottomSheetModal, ActionMenuProps>(
  ({ title, subtitle, groups }, ref) => {
    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.4}
        />
      ),
      [],
    );

    const dismiss = useCallback(() => {
      (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
    }, [ref]);

    const getIconColor = (item: ActionMenuItem) => {
      if (item.destructive) return COLORS.error;
      return item.iconColor || COLORS.text;
    };

    const getTextColor = (item: ActionMenuItem) => {
      if (item.destructive) return COLORS.error;
      return item.textColor || COLORS.text;
    };

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleHidden}
        detached
        bottomInset={40}
        style={styles.sheet}
        backgroundStyle={styles.sheetBg}
      >
        <BottomSheetView style={styles.content}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={dismiss} hitSlop={10} style={styles.closeBtn} activeOpacity={0.6}>
              <Ionicons name="close" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : null}

          {/* ── Groups ── */}
          {groups.map((group, gi) => {
            const isCustom = group.some((it) => !!it.background);

            if (isCustom) {
              // Custom-bg group: each item is a standalone rounded button
              return (
                <View key={gi} style={gi > 0 ? styles.groupSpacing : undefined}>
                  {group.map((item, ii) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => { dismiss(); item.onPress(); }}
                      activeOpacity={0.6}
                      style={[
                        styles.customBtn,
                        { backgroundColor: item.background || COLORS.text },
                        ii > 0 && { marginTop: SPACING.sm },
                      ]}
                    >
                      <View style={styles.row}>
                        <Ionicons name={item.icon} size={28} color={getIconColor(item)} />
                        <Text style={[styles.label, { color: getTextColor(item) }]}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            }

            // Default group: shared background, dividers between items
            return (
              <View key={gi} style={[styles.defaultGroup, gi > 0 ? styles.groupSpacing : undefined]}>
                {group.map((item, ii) => (
                  <React.Fragment key={item.label}>
                    {ii > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      onPress={() => { dismiss(); item.onPress(); }}
                      activeOpacity={0.6}
                      style={styles.defaultBtn}
                    >
                      <View style={styles.row}>
                        <Ionicons name={item.icon} size={28} color={getIconColor(item)} />
                        <Text style={[styles.label, { color: getTextColor(item) }]}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            );
          })}
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
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.xs,
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
    marginBottom: SPACING.md,
    ...FONTS.regular,
  },
  groupSpacing: {
    marginTop: SPACING.sm,
  },
  defaultGroup: {
    borderRadius: RADIUS.md,
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    overflow: 'hidden' as const,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D1D1D6',
    marginHorizontal: 18,
  },
  customBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  defaultBtn: {
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  label: {
    fontSize: 16,
    marginLeft: SPACING.sm,
    ...FONTS.medium,
  },
});

export default ActionMenu;
