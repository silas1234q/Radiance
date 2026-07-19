import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
  Modal,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useSkinProfile } from '../hooks/queries/useProfile';
import { useSkinScores } from '../hooks/queries/useSkinScores';
import { useSkinLogs } from '../hooks/queries/useSkinLogs';
import { COLORS } from '../constants/theme';
import GlassIconButton from '../components/ui/GlassIconButton';
import type { SkinScore } from '../types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface MetricDef {
  key: keyof SkinScore;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  positiveIsUp: boolean;
}

const METRICS: MetricDef[] = [
  { key: 'hydration', label: 'Hydration', icon: 'water', color: '#3B82F6', bgColor: '#EFF6FF', positiveIsUp: true },
  { key: 'oilBalance', label: 'Oil Balance', icon: 'fitness', color: '#8B5CF6', bgColor: '#F5F3FF', positiveIsUp: true },
  { key: 'texture', label: 'Barrier', icon: 'shield-checkmark', color: '#10B981', bgColor: '#ECFDF5', positiveIsUp: true },
  { key: 'evenTone', label: 'Clarity', icon: 'sparkles', color: '#F59E0B', bgColor: '#FFFBEB', positiveIsUp: true },
  { key: 'sensitivity', label: 'Sensitivity', icon: 'flower', color: '#EC4899', bgColor: '#FDF2F8', positiveIsUp: false },
];

function MetricRow({ m, first, last, index }: { m: MetricDef; first: number; last: number; index: number }) {
  const diff = last - first;
  const isPositive = m.positiveIsUp ? diff > 0 : diff < 0;
  const isNegative = m.positiveIsUp ? diff < 0 : diff > 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 60).duration(400)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: index < METRICS.length - 1 ? 0.5 : 0,
        borderBottomColor: 'rgba(0,0,0,0.04)',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: m.bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={m.icon} size={18} color={m.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: 'SFProRounded_Semibold', color: COLORS.text }}>
          {m.label}
        </Text>
        <Text style={{ fontSize: 12, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary, marginTop: 1 }}>
          {first} {'  \u2192  '} {last}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isPositive ? '#DCFCE7' : isNegative ? '#FEE2E2' : '#F3F4F6',
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 5,
          gap: 3,
        }}
      >
        {diff !== 0 && (
          <Ionicons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={isPositive ? '#16A34A' : '#DC2626'}
          />
        )}
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'SFProRounded_Bold',
            color: isPositive ? '#16A34A' : isNegative ? '#DC2626' : COLORS.textSecondary,
          }}
        >
          {diff > 0 ? '+' : ''}{diff}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Mosaic layout definitions ──
// Each tile: fractional position/size relative to container width,
// plus a rotation for that scattered-polaroid look.
const MOSAIC_LAYOUTS = [
  // Row 1: one large left, one small right-top, one small right-bottom
  { x: 0.02, y: 0, w: 0.58, h: 0.52, rotate: '-2deg' },
  { x: 0.62, y: 0.02, w: 0.36, h: 0.24, rotate: '3deg' },
  { x: 0.64, y: 0.28, w: 0.34, h: 0.24, rotate: '-1.5deg' },
  // Row 2: two medium side by side, one small overlapping
  { x: 0.0, y: 0.54, w: 0.38, h: 0.28, rotate: '2.5deg' },
  { x: 0.40, y: 0.55, w: 0.42, h: 0.30, rotate: '-3deg' },
  { x: 0.82, y: 0.58, w: 0.17, h: 0.18, rotate: '4deg' },
  // Row 3: scattered bottom
  { x: 0.05, y: 0.84, w: 0.30, h: 0.22, rotate: '-2.5deg' },
  { x: 0.37, y: 0.87, w: 0.28, h: 0.20, rotate: '1.5deg' },
  { x: 0.68, y: 0.82, w: 0.30, h: 0.24, rotate: '-3.5deg' },
];

interface MosaicPhoto {
  id: string;
  uri: string;
  date: string;
  label?: string;
}

function DraggableTile({
  photo,
  tile,
  index,
  containerWidth,
  containerHeight,
  onPhotoPress,
}: {
  photo: MosaicPhoto;
  tile: (typeof MOSAIC_LAYOUTS)[0];
  index: number;
  containerWidth: number;
  containerHeight: number;
  onPhotoPress: (photo: MosaicPhoto) => void;
}) {
  const tileW = tile.w * containerWidth;
  const tileH = tile.h * containerHeight;
  const tileX = tile.x * containerWidth;
  const tileY = tile.y * containerHeight;
  const framePad = Math.max(3, Math.min(tileW, tileH) * 0.06);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIdx = useSharedValue(index);
  const isDragging = useSharedValue(false);

  const hapticTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const hapticPickUp = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const hapticDrop = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const tap = Gesture.Tap().onEnd(() => {
    if (!isDragging.value) {
      runOnJS(hapticTap)();
      runOnJS(onPhotoPress)(photo);
    }
  });

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .onStart(() => {
      isDragging.value = false;
      zIdx.value = 100;
      scale.value = withSpring(1.08, { damping: 15 });
      runOnJS(hapticPickUp)();
    })
    .onUpdate((e) => {
      if (Math.abs(e.translationX) > 4 || Math.abs(e.translationY) > 4) {
        isDragging.value = true;
      }
      translateX.value = offsetX.value + e.translationX;
      translateY.value = offsetY.value + e.translationY;
    })
    .onEnd(() => {
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
      scale.value = withSpring(1, { damping: 15 });
      zIdx.value = index;
      runOnJS(hapticDrop)();
    });

  const gesture = Gesture.Simultaneous(tap, pan);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: tile.rotate },
      { scale: scale.value },
    ],
    zIndex: zIdx.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        entering={FadeIn.delay(150 + index * 100).duration(500)}
        style={[
          {
            position: 'absolute',
            left: tileX,
            top: tileY,
            width: tileW,
            height: tileH,
            backgroundColor: '#fff',
            borderRadius: 6,
            padding: framePad,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 4,
          },
          animStyle,
        ]}
      >
        <Image
          source={{ uri: photo.uri }}
          style={{
            flex: 1,
            borderRadius: 3,
            backgroundColor: '#f0f0f0',
          }}
          resizeMode="cover"
        />
        <View style={{ paddingTop: framePad * 0.6, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: Math.max(8, tileW * 0.065),
              fontFamily: 'SFProRounded_Medium',
              color: COLORS.textSecondary,
            }}
            numberOfLines={1}
          >
            {photo.label ?? formatDate(photo.date)}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function PhotoMosaic({ photos, onPhotoPress }: { photos: MosaicPhoto[]; onPhotoPress: (photo: MosaicPhoto) => void }) {
  const containerWidth = SCREEN_WIDTH - 40;
  const containerHeight = containerWidth * 1.15;
  const tiles = MOSAIC_LAYOUTS.slice(0, photos.length);

  return (
    <View style={{ width: containerWidth, height: containerHeight, alignSelf: 'center' }}>
      {tiles.map((tile, i) => (
        <DraggableTile
          key={photos[i].id}
          photo={photos[i]}
          tile={tile}
          index={i}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          onPhotoPress={onPhotoPress}
        />
      ))}
    </View>
  );
}

function FullScreenViewer({ photo, onClose }: { photo: MosaicPhoto; onClose: () => void }) {
  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' }}>
        {/* Close button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
          }}
          hitSlop={12}
          style={{
            position: 'absolute',
            top: 54,
            right: 20,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>

        {/* Image */}
        <Image
          source={{ uri: photo.uri }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.3 }}
          resizeMode="contain"
        />

        {/* Date label */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Semibold', color: '#fff' }}>
            {photo.label ?? formatDate(photo.date)}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export default function SkinComparisonModal() {
  const router = useRouter();
  const { data: profile } = useSkinProfile();
  const { data: scores } = useSkinScores();
  const { data: skinLogs } = useSkinLogs();
  const [viewerPhoto, setViewerPhoto] = useState<MosaicPhoto | null>(null);

  const sorted = useMemo(() => {
    if (!scores || scores.length < 2) return null;
    const s = [...scores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { first: s[0], last: s[s.length - 1] };
  }, [scores]);

  const overallChange = useMemo(() => {
    if (!sorted) return null;
    return sorted.last.score - sorted.first.score;
  }, [sorted]);

  const mosaicPhotos = useMemo(() => {
    const photos: MosaicPhoto[] = [];

    if (profile?.photoUrl) {
      photos.push({
        id: 'before',
        uri: profile.photoUrl,
        date: sorted?.first.date ?? new Date().toISOString(),
        label: 'Day 1',
      });
    }

    if (skinLogs) {
      const withPhoto = skinLogs
        .filter((l) => l.photoUrl)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      withPhoto.forEach((log) => {
        photos.push({
          id: log.id,
          uri: log.photoUrl!,
          date: log.date,
        });
      });
    }

    return photos;
  }, [profile, skinLogs, sorted]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Floating header */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 120,
          }}
        >
          <LinearGradient
            colors={['rgba(242,242,247,0.9)', 'rgba(242,242,247,0)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 80,
              zIndex: 0,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 12,
              backgroundColor: 'transparent',
              zIndex: 1,
            }}
          >
            <View style={{ width: 42 }} />
            <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Semibold', color: COLORS.text }}>
              Your Progress
            </Text>
            <GlassIconButton icon="close" onPress={() => router.back()} iconSize={18} />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 50, paddingTop: 50 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Overall score change hero */}
          {sorted && overallChange !== null && (
            <Animated.View
              entering={FadeInDown.delay(80).duration(450)}
              style={{ alignItems: 'center', marginTop: 22, marginBottom: 6 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 42,
                    fontFamily: 'SFProRounded_Bold',
                    color: overallChange >= 0 ? '#16A34A' : '#DC2626',
                  }}
                >
                  {overallChange > 0 ? '+' : ''}{overallChange}
                </Text>
                <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Medium', color: COLORS.textSecondary }}>
                  pts
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary, marginTop: 2 }}>
                Overall skin score since {formatDate(sorted.first.date)}
              </Text>
            </Animated.View>
          )}

          {/* Before vs Now side-by-side */}
          <Animated.View entering={FadeInDown.delay(150).duration(450)} style={{ paddingHorizontal: 20, marginTop: 18 }}>
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                borderRadius: 22,
                overflow: 'hidden',
                backgroundColor: '#fff',
                padding: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 3,
              }}
            >
              {/* Before */}
              <View style={{ flex: 1 }}>
                {profile?.photoUrl ? (
                  <Image
                    source={{ uri: profile.photoUrl }}
                    style={{ width: '100%', height: 190, borderRadius: 16, backgroundColor: '#f0f0f0' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: '100%', height: 190, borderRadius: 16, backgroundColor: '#FAF5EE', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="person-outline" size={32} color="#D4C5AA" />
                    <Text style={{ fontSize: 11, fontFamily: 'SFProRounded_Medium', color: '#C4B89A', marginTop: 6 }}>
                      No photo
                    </Text>
                  </View>
                )}
                <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                  <View style={{ backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'SFProRounded_Semibold', color: COLORS.textSecondary }}>
                      Before
                    </Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={{ width: 1, backgroundColor: '#F0F0F0', marginVertical: 8 }} />

              {/* Now */}
              <View style={{ flex: 1 }}>
                {(() => {
                  const nowPhoto = skinLogs?.filter((l) => l.photoUrl)?.[0]?.photoUrl;
                  return nowPhoto ? (
                    <Image
                      source={{ uri: nowPhoto }}
                      style={{ width: '100%', height: 190, borderRadius: 16, backgroundColor: '#f0f0f0' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: '100%', height: 190, borderRadius: 16, backgroundColor: '#EEF5EE', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="camera-outline" size={32} color="#A8CCB0" />
                      <Text style={{ fontSize: 11, fontFamily: 'SFProRounded_Medium', color: '#8AB894', marginTop: 6 }}>
                        No photo yet
                      </Text>
                    </View>
                  );
                })()}
                <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                  <View style={{ backgroundColor: '#DCFCE7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'SFProRounded_Semibold', color: '#16A34A' }}>
                      Now
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Metric Changes */}
          <Animated.View entering={FadeInDown.delay(220).duration(450)} style={{ paddingHorizontal: 20, marginTop: 22 }}>
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 22,
                padding: 18,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="analytics" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Bold', color: COLORS.text }}>
                  Metric Breakdown
                </Text>
              </View>

              {!sorted ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Ionicons name="bar-chart-outline" size={36} color="#D1D5DB" />
                  <Text style={{ fontSize: 14, fontFamily: 'SFProRounded_Medium', color: COLORS.textSecondary, marginTop: 10, textAlign: 'center' }}>
                    Complete at least 2 skin scans{'\n'}to see your progress
                  </Text>
                  <Pressable
                    onPress={() => {
                      router.back();
                      setTimeout(() => router.push('/(onboarding)/face-scan'), 300);
                    }}
                    style={{
                      marginTop: 14,
                      backgroundColor: COLORS.primary,
                      borderRadius: 20,
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="scan" size={16} color="#fff" />
                    <Text style={{ fontSize: 13, fontFamily: 'SFProRounded_Semibold', color: '#fff' }}>
                      New Skin Scan
                    </Text>
                  </Pressable>
                </View>
              ) : (
                METRICS.map((m, i) => (
                  <MetricRow
                    key={m.key}
                    m={m}
                    first={(sorted.first[m.key] as number | null) ?? 0}
                    last={(sorted.last[m.key] as number | null) ?? 0}
                    index={i}
                  />
                ))
              )}
            </View>
          </Animated.View>

          {/* Photo Mosaic — "Your Skin Journey" */}
          <Animated.View entering={FadeInDown.delay(350).duration(450)} style={{ marginTop: 24 }}>
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="images" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontFamily: 'SFProRounded_Bold', color: COLORS.text }}>
                  Your Skin Journey
                </Text>
              </View>
              {mosaicPhotos.length > 0 && (
                <Text style={{ fontSize: 12, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary, marginTop: 3, marginLeft: 26 }}>
                  {mosaicPhotos.length} photo{mosaicPhotos.length !== 1 ? 's' : ''} logged
                </Text>
              )}
            </View>

            {mosaicPhotos.length === 0 ? (
              <View
                style={{
                  marginHorizontal: 20,
                  backgroundColor: '#fff',
                  borderRadius: 22,
                  padding: 32,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#FDF2F8',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="camera-outline" size={26} color={COLORS.primary} />
                </View>
                <Text style={{ fontSize: 15, fontFamily: 'SFProRounded_Semibold', color: COLORS.text }}>
                  No photos yet
                </Text>
                <Text style={{ fontSize: 13, fontFamily: 'SFProRounded_Regular', color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                  Take photos during your skin logs{'\n'}to track your visual progress
                </Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 20 }}>
                <PhotoMosaic photos={mosaicPhotos} onPhotoPress={setViewerPhoto} />
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {viewerPhoto && (
        <FullScreenViewer photo={viewerPhoto} onClose={() => setViewerPhoto(null)} />
      )}
    </View>
  );
}
