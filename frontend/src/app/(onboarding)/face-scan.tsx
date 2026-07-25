import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Dimensions, InteractionManager, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Brightness from 'expo-brightness';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  FaceDetectionProvider,
  useFaceDetection,
  type RNMLKitFaceDetectorOptions,
} from '@infinitered/react-native-mlkit-face-detection';
import { validateFaceScan } from '../../lib/faceValidation';
import { COLORS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GUIDE_SIZE = SCREEN_WIDTH * 0.72;
const GUIDE_HEIGHT = GUIDE_SIZE * 1.25;

const G_BRACKET = 34;
const G_BW = 2.5;
const G_WHITE = 'rgba(255,255,255,0.92)';
const G_EDGE_INSET = 34;
const guide = StyleSheet.create({
  edge: {
    position: 'absolute',
    left: G_EDGE_INSET,
    right: G_EDGE_INSET,
    height: G_BW,
    backgroundColor: G_WHITE,
    borderRadius: G_BW,
  },
  topEdge: { top: 0 },
  bottomEdge: { bottom: 0 },
  edgeError: { backgroundColor: COLORS.primary },
  bracket: { position: 'absolute', width: G_BRACKET, height: G_BRACKET, borderColor: G_WHITE },
  bracketError: { borderColor: COLORS.primary },
  tl: { top: 0, left: 0, borderLeftWidth: G_BW, borderTopWidth: G_BW, borderTopLeftRadius: 24 },
  tr: { top: 0, right: 0, borderRightWidth: G_BW, borderTopWidth: G_BW, borderTopRightRadius: 24 },
  bl: { bottom: 0, left: 0, borderLeftWidth: G_BW, borderBottomWidth: G_BW, borderBottomLeftRadius: 24 },
  br: { bottom: 0, right: 0, borderRightWidth: G_BW, borderBottomWidth: G_BW, borderBottomRightRadius: 24 },
});

// Landmarks + classification (eyes open) power the validation checks; contours
// are unnecessary and slower. "accurate" mode maximizes detection reliability
// for a single deliberate capture.
const DETECTOR_OPTIONS: RNMLKitFaceDetectorOptions = {
  performanceMode: 'accurate',
  landmarkMode: true,
  classificationMode: true,
  contourMode: false,
};

type Phase = 'preview' | 'capturing' | 'validating';

/**
 * From the camera's supported still sizes, pick the highest-resolution option.
 * On iOS the "photo" preset yields the full sensor resolution; on Android the
 * sizes come back as "WIDTHxHEIGHT" strings, so we pick the largest by area.
 */
function pickBestPictureSize(sizes: string[]): string | undefined {
  let best: string | undefined;
  let bestArea = 0;
  for (const s of sizes) {
    const m = /(\d+)x(\d+)/.exec(s);
    if (m) {
      const area = Number(m[1]) * Number(m[2]);
      if (area > bestArea) {
        bestArea = area;
        best = s;
      }
    }
  }
  if (sizes.includes('photo')) return 'photo';
  return best;
}

export default function FaceScanScreen() {
  return (
    <FaceDetectionProvider options={DETECTOR_OPTIONS}>
      <FaceScanInner />
    </FaceDetectionProvider>
  );
}

function FaceScanInner() {
  const router = useRouter();
  // Launched from the onboarding quiz with `onboarding=1` — in that flow the
  // scan is a required step, so no close button. Everywhere else (dashboard,
  // routine, comparison) it's optional and gets a close button.
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === '1';
  const detector = useFaceDetection();
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [pictureSize, setPictureSize] = useState<string | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>('preview');
  const [error, setError] = useState<string | null>(null);
  // Front camera has no hardware flash; when on, we light the face with a
  // bright white screen right before capture (like the iOS Retina Flash).
  const [flashOn, setFlashOn] = useState(false);
  // Touching the camera immediately can race the screen's push transition on
  // iOS; wait until the transition settles before mounting the preview.
  const [interactionsDone, setInteractionsDone] = useState(false);

  // Capture flash
  const flash = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setInteractionsDone(true));
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const onCameraReady = useCallback(async () => {
    setCameraReady(true);
    try {
      const sizes = await cameraRef.current?.getAvailablePictureSizesAsync();
      if (sizes && sizes.length) {
        const best = pickBestPictureSize(sizes);
        if (best) setPictureSize(best);
      }
    } catch {
      // Fall back to the camera default resolution.
    }
  }, []);

  const capture = useCallback(async () => {
    if (phase !== 'preview' || !cameraRef.current || !cameraReady) return;
    setError(null);

    let prevBrightness: number | null = null;
    const fail = (reason: string) => {
      setError(reason);
      setPhase('preview');
    };

    try {
      setPhase('capturing');

      if (flashOn) {
        // Screen flash: crank the display to full white/brightness and hold it
        // long enough to light the face before the shutter fires.
        try {
          prevBrightness = await Brightness.getBrightnessAsync();
          await Brightness.setBrightnessAsync(1);
        } catch {
          // Brightness control unavailable — the white overlay still helps.
        }
        flash.value = withTiming(1, { duration: 120 });
        await new Promise((resolve) => setTimeout(resolve, 260));
      } else {
        // Shutter blink for feedback.
        flash.value = withSequence(
          withTiming(0.85, { duration: 60 }),
          withTiming(0, { duration: 260 }),
        );
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
        exif: false,
      });

      if (flashOn) {
        flash.value = withTiming(0, { duration: 200 });
        if (prevBrightness != null) {
          Brightness.setBrightnessAsync(prevBrightness).catch(() => {});
        }
      }

      if (!photo?.uri) {
        fail('Something went wrong. Please try again.');
        return;
      }

      setPhase('validating');
      const result = await detector.detectFaces(photo.uri);
      const validation = validateFaceScan(result, photo.width, photo.height);
      if (!validation.ok) {
        fail(validation.reason);
        return;
      }

      // Hand the captured photo off to the processing screen, which uploads it,
      // runs the scan analysis, and routes to results.
      router.replace(`/(onboarding)/scan-processing?uri=${encodeURIComponent(photo.uri)}`);
    } catch (e) {
      flash.value = withTiming(0, { duration: 150 });
      if (prevBrightness != null) {
        Brightness.setBrightnessAsync(prevBrightness).catch(() => {});
      }
      fail('Something went wrong. Please try again.');
    }
  }, [phase, cameraReady, detector, router, flash, flashOn]);

  // --- Permission states ---
  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
        {!isOnboarding && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.06)',
            }}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </Pressable>
        )}
        <Text className="text-[18px] font-poppins-semibold text-skin-text text-center mb-2">
          Camera access needed
        </Text>
        <Text className="text-[14px] font-poppins-regular text-skin-text-secondary text-center mb-6">
          We use your front camera to scan your skin. Your photo is only used for your analysis.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="h-[48px] px-8 rounded-2xl bg-primary items-center justify-center"
        >
          <Text className="text-[14px] font-poppins-semibold text-white">Enable Camera</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            isOnboarding ? router.replace('/(onboarding)/results?locked=1') : router.back()
          }
          className="mt-4 py-2"
        >
          <Text className="text-[14px] font-poppins-medium text-skin-text-tertiary">Not now</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const busy = phase !== 'preview';

  return (
    <View className="flex-1 bg-black">
      {interactionsDone && (
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="front"
          pictureSize={pictureSize}
          onCameraReady={onCameraReady}
        />
      )}

      {/* --- Idle preview UI --- */}
      {!busy && (
        <>
          {/* Face guide frame (matches the scanning overlay) */}
          <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
            <View style={{ width: GUIDE_SIZE, height: GUIDE_HEIGHT }}>
              <View style={[guide.edge, guide.topEdge, error && guide.edgeError]} />
              <View style={[guide.edge, guide.bottomEdge, error && guide.edgeError]} />
              <View style={[guide.bracket, guide.tl, error && guide.bracketError]} />
              <View style={[guide.bracket, guide.tr, error && guide.bracketError]} />
              <View style={[guide.bracket, guide.bl, error && guide.bracketError]} />
              <View style={[guide.bracket, guide.br, error && guide.bracketError]} />
            </View>
          </View>

          <SafeAreaView className="absolute inset-0" pointerEvents="box-none">
            {/* Flash toggle (screen flash for the front camera) */}
            <Pressable
              onPress={() => setFlashOn((v) => !v)}
              hitSlop={12}
              style={{
                position: 'absolute',
                top: 50,
                left: 20,
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: flashOn ? COLORS.primary : 'rgba(0,0,0,0.45)',
              }}
            >
              <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={22} color="#fff" />
            </Pressable>

            {/* Close (hidden during onboarding, where the scan is required) */}
            {!isOnboarding && (
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={{
                  position: 'absolute',
                  top: 50,
                  right: 20,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.45)',
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            )}

            {/* Top instruction / error */}
            <View className="px-6 pt-4 items-center" pointerEvents="none">
              {error ? (
                <Animated.View
                  entering={FadeIn.duration(250)}
                  className="px-4 py-2.5 rounded-2xl"
                  style={{ backgroundColor: 'rgba(240,102,128,0.92)' }}
                >
                  <Text className="text-[14px] font-poppins-semibold text-white text-center">{error}</Text>
                </Animated.View>
              ) : (
                <View className="px-4 py-2.5 rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                  <Text className="text-[14px] font-poppins-medium text-white text-center">
                    Position your face in the circle
                  </Text>
                </View>
              )}
            </View>

            {/* Bottom controls */}
            <View className="mt-auto items-center pb-8" pointerEvents="box-none">
              <Pressable
                onPress={capture}
                disabled={!cameraReady}
                hitSlop={12}
                style={({ pressed }) => ({
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  borderWidth: 5,
                  borderColor: 'rgba(255,255,255,0.9)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: cameraReady ? (pressed ? 0.7 : 1) : 0.4,
                })}
              >
                <View
                  style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.primary }}
                />
              </Pressable>
            </View>
          </SafeAreaView>
        </>
      )}

      {/* Capture flash */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }, flashStyle]}
      />
    </View>
  );
}
