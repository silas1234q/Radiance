import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useAnalyzeSkinWithScan } from '../../hooks/queries/useQuiz';
import { uploadSkinPhoto } from '../../api/uploadPhoto';
import { useSimulatedFaceChecks } from '../../hooks/useSimulatedFaceChecks';
import { StatusPillBar } from '../../components/face-scan/StatusPillBar';
import { InstructionBubble } from '../../components/face-scan/InstructionBubble';
import { FaceGuideOverlay, FRAME_H } from '../../components/face-scan/FaceGuideOverlay';
import { CaptureFlash } from '../../components/face-scan/CaptureFlash';
import { PhotoPreview } from '../../components/face-scan/PhotoPreview';
import { ScanAnalyzing } from '../../components/face-scan/ScanAnalyzing';
import { COLORS } from '../../constants/theme';

const { height: SCREEN_H } = Dimensions.get('window');

type ScreenState = 'camera' | 'preview' | 'analyzing';

export default function FaceScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const analyzeScan = useAnalyzeSkinWithScan();
  const cameraRef = useRef<CameraView>(null);

  const [state, setState] = useState<ScreenState>('camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flashTrigger, setFlashTrigger] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  // Simulated face checks
  const { checks, checkStatuses, allPassed, reset: resetChecks } =
    useSimulatedFaceChecks(state === 'camera' && !!permission?.granted);

  const passedCount = checkStatuses.filter((s) => s.passed).length;

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        setPhotoUri(photo.uri);
        setFlashTrigger(true);
        setTimeout(() => setFlashTrigger(false), 500);
        setState('preview');
        setError(null);
      }
    } catch {
      setError('Failed to take photo. Please try again.');
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setError(null);
    setState('camera');
    resetChecks();
  };

  const getTokenWithRetry = async (retries = 3, delay = 500): Promise<string> => {
    for (let i = 0; i < retries; i++) {
      const token = await getToken();
      if (token) return token;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new Error('Not authenticated');
  };

  const handleAnalyze = async () => {
    setState('analyzing');
    setError(null);

    try {
      const token = await getTokenWithRetry();

      const cloudinaryUrl = await uploadSkinPhoto(photoUri ?? '', token);

      analyzeScan.mutate(cloudinaryUrl, {
        onSuccess: () => router.replace('/(onboarding)/results'),
        onError: (err) => {
          setState('preview');
          setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
        },
      });
    } catch (err) {
      setState('preview');
      setError(err instanceof Error ? err.message : 'Failed to upload photo. Please try again.');
    }
  };

  // --- Permission loading ---
  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  // --- Permission denied ---
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-[22px] font-poppins-bold text-skin-text text-center mb-3">
          Camera Access Needed
        </Text>
        <Text className="text-[15px] font-poppins-regular text-skin-text-secondary text-center leading-[22px] mb-8">
          We need camera access to scan your skin and provide a personalized analysis. Your photos
          are only used for analysis and are never shared.
        </Text>

        {permission.canAskAgain ? (
          <Pressable
            onPress={requestPermission}
            className="h-[56px] w-full rounded-2xl bg-primary items-center justify-center mb-3"
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Text className="text-[16px] font-poppins-semibold text-white">
              Allow Camera Access
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => Linking.openSettings()}
            className="h-[56px] w-full rounded-2xl bg-primary items-center justify-center mb-3"
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Text className="text-[16px] font-poppins-semibold text-white">Open Settings</Text>
          </Pressable>
        )}

        <Pressable onPress={() => router.back()} className="h-[48px] items-center justify-center">
          <Text className="text-[14px] font-poppins-medium text-skin-text-secondary">
            Maybe later
          </Text>
        </Pressable>
      </View>
    );
  }

  // --- Analyzing state ---
  if (state === 'analyzing') {
    return <ScanAnalyzing photoUri={photoUri} />;
  }

  // --- Preview state ---
  if (state === 'preview' && photoUri) {
    return (
      <PhotoPreview
        photoUri={photoUri}
        error={error}
        onAnalyze={handleAnalyze}
        onRetake={handleRetake}
      />
    );
  }

  // --- Camera viewfinder ---
  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />

      {/* Face guide overlay with dimming */}
      <FaceGuideOverlay passedCount={passedCount} />

      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        style={{ top: insets.top + 8, left: 16 }}
        className="absolute z-10 w-10 h-10 rounded-full bg-black/30 items-center justify-center"
      >
        <Text className="text-white text-[22px] mt-[-2px]">{'\u2039'}</Text>
      </Pressable>

      {/* Status pills */}
      <View
        className="absolute left-0 right-0"
        style={{ top: insets.top + 14 }}
      >
        <StatusPillBar statuses={checkStatuses} />
      </View>

      {/* Error banner */}
      {error && (
        <View
          className="absolute left-0 right-0 items-center"
          style={{ top: insets.top + 56 }}
        >
          <View className="bg-red-500/90 px-5 py-3 rounded-xl mx-6">
            <Text className="text-white text-[14px] font-poppins-medium text-center">
              {error}
            </Text>
          </View>
        </View>
      )}

      {/* Instruction bubble below frame */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: SCREEN_H / 2 + FRAME_H / 2 - 10,
          alignItems: 'center',
        }}
      >
        <InstructionBubble
          checks={checks}
          captureState="scanning"
          countdownNumber={3}
        />
      </View>

      {/* Shutter button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          paddingBottom: insets.bottom + 28,
          zIndex: 20,
          elevation: 20,
        }}
      >
        <Pressable
          onPress={handleTakePhoto}
          disabled={!allPassed}
          style={({ pressed }) => ({
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 4,
            borderColor: allPassed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed && allPassed ? 0.7 : 1,
          })}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: allPassed ? COLORS.primary : 'rgba(255,255,255,0.25)',
            }}
          />
        </Pressable>
      </View>

      {/* Capture flash */}
      <CaptureFlash trigger={flashTrigger} />
    </View>
  );
}
