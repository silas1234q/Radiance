import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../constants/theme';
import { Image } from 'expo-image';
import ScanFace from '@/src/assets/images/face-scan.jpg';
import ScanCosmetics from '@/src/assets/images/products.jpg';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 56) / 2;

interface ScanModalProps {
  visible: boolean;
  onClose: () => void;
  onFaceScan: () => void;
  onCosmeticsScan: () => void;
  faceScansLeft: number;
  /** Purchased scan credits available. */
  faceCredits: number;
  /** Remaining free product scans. null = unlimited (Pro user). */
  productScansLeft: number | null;
}

export default function ScanModal({
  visible,
  onClose,
  onFaceScan,
  onCosmeticsScan,
  faceScansLeft,
  faceCredits,
  productScansLeft,
}: ScanModalProps) {
  const totalFaceScans = faceScansLeft + faceCredits;
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <BlurView
          intensity={60}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.cubic))}
          style={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        >
          <Text style={styles.title}>Make a New Scan</Text>

          <View style={styles.cardsRow}>
            {/* Face Scan Card */}
            <TouchableOpacity
              onPress={onFaceScan}
              activeOpacity={0.9}
              style={styles.card}
            >
              <View style={[styles.badge, totalFaceScans > 0 ? styles.badgeActive : styles.badgePurchase]}>
                <Text style={[styles.badgeText, totalFaceScans > 0 ? styles.badgeTextActive : styles.badgeTextPurchase]}>
                  {totalFaceScans > 0
                    ? `${totalFaceScans} ${totalFaceScans === 1 ? 'scan' : 'scans'} left`
                    : 'Buy a scan'}
                </Text>
              </View>
              <View style={styles.iconCircle}>
                <Image source={ScanFace} style={{ width: '100%', height: '100%' }} />
              </View>
              <Text style={styles.cardTitle}>Face</Text>
              <Text style={styles.cardDesc}>
                See the condition of your skin
              </Text>
            </TouchableOpacity>

            {/* Cosmetics Scan Card */}
            <TouchableOpacity
              onPress={onCosmeticsScan}
              activeOpacity={0.9}
              style={[styles.card, productScansLeft === 0 && { opacity: 0.5 }]}
              disabled={productScansLeft === 0}
            >
              <View style={[styles.badge, productScansLeft === null || productScansLeft > 0 ? styles.badgeActive : styles.badgeDisabled]}>
                <Text style={[styles.badgeText, productScansLeft === null || productScansLeft > 0 ? styles.badgeTextActive : styles.badgeTextDisabled]}>
                  {productScansLeft === null
                    ? 'Unlimited'
                    : productScansLeft === 0
                      ? 'No scans left'
                      : `${productScansLeft} ${productScansLeft === 1 ? 'scan' : 'scans'} left`}
                </Text>
              </View>
              <View style={styles.iconCircle}>
                <Image source={ScanCosmetics} style={{ width: '100%', height: '100%' }} />
              </View>
              <Text style={styles.cardTitle}>Cosmetics</Text>
              <Text style={styles.cardDesc}>
                See if a skincare product fits you
              </Text>
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 20,
    ...FONTS.bold,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: CARD_W,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
  },
  badgeDisabled: {
    backgroundColor: '#FFE0E6',
  },
  badgeActive: {
    backgroundColor: '#E8E4F8',
  },
  badgePurchase: {
    backgroundColor: '#FFE0E6',
  },
  badgeText: {
    fontSize: 12,
    ...FONTS.semibold,
  },
  badgeTextDisabled: {
    color: COLORS.primary,
  },
  badgeTextActive: {
    color: '#7C6FE0',
  },
  badgeTextPurchase: {
    color: COLORS.primary,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F7F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    color: '#1C1C1E',
    marginBottom: 4,
    ...FONTS.bold,
  },
  cardDesc: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    ...FONTS.regular,
  },
  closeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});
