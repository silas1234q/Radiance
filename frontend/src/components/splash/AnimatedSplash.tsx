/**
 * AnimatedSplash — the JS splash overlay that plays after the native splash.
 *
 * To feel like a SINGLE continuous splash, its first frame is pixel-matched to
 * the native splash: the same image (`splash-icon.png`) at the same size (200,
 * contain) centered on white. It holds the native splash via
 * preventAutoHideAsync and only calls hideAsync once this identical frame has
 * painted — so the handoff is invisible. The icon stays put at the exact screen
 * centre (matching native) while the "Radiance" wordmark fades up beneath it,
 * then the whole thing fades out once the app is ready.
 */
import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../../constants/theme';
import { getNavReady, subscribeNavReady } from '../../lib/splash/ready';

// Match the native splash config in app.json (imageWidth: 200, contain, white).
const ICON_SIZE = 200;
const MIN_VISIBLE_MS = 1800; // let the animation be seen
const MAX_VISIBLE_MS = 6000; // hard cap so it can never get stuck
const EXIT_MS = 400;

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { height } = useWindowDimensions();

  const navReady = useSyncExternalStore(subscribeNavReady, getNavReady, getNavReady);

  // Animation drivers. The icon starts fully visible (opacity 1, scale 1) so it
  // matches the native splash exactly — only a gentle breathing scale plays.
  const iconScale = useSharedValue(1);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkY = useSharedValue(14);
  const rootOpacity = useSharedValue(1);
  const rootScale = useSharedValue(1);

  const hidNative = useRef(false);
  const mountedAt = useRef(Date.now());
  const exiting = useRef(false);

  // Hide the native splash once we've painted the matching frame.
  const onLayout = () => {
    if (hidNative.current) return;
    hidNative.current = true;
    SplashScreen.hideAsync().catch(() => {});

    // Subtle breathing on the icon (it's already in the native position).
    iconScale.value = withDelay(
      250,
      withSequence(
        withTiming(1.04, { duration: 380, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 340, easing: Easing.inOut(Easing.quad) }),
      ),
    );
    wordmarkOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    wordmarkY.value = withDelay(300, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
  };

  const runExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    rootScale.value = withTiming(1.04, { duration: EXIT_MS, easing: Easing.in(Easing.quad) });
    rootOpacity.value = withTiming(0, { duration: EXIT_MS, easing: Easing.in(Easing.quad) }, (done) => {
      if (done) runOnJS(onFinish)();
    });
  };

  // Dismiss when the app is ready (respecting the minimum), with a hard cap.
  useEffect(() => {
    const elapsed = Date.now() - mountedAt.current;
    let timer: ReturnType<typeof setTimeout>;
    if (navReady) {
      timer = setTimeout(runExit, Math.max(0, MIN_VISIBLE_MS - elapsed));
    } else {
      timer = setTimeout(runExit, Math.max(0, MAX_VISIBLE_MS - elapsed));
    }
    return () => clearTimeout(timer);
  }, [navReady]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));
  const rootStyle = useAnimatedStyle(() => ({
    opacity: rootOpacity.value,
    transform: [{ scale: rootScale.value }],
  }));

  // Keep the icon at the true screen centre (matching native); place the
  // wordmark absolutely below it so revealing it doesn't shift the icon.
  const wordmarkTop = height / 2 + ICON_SIZE / 2 + 8;

  return (
    <Animated.View
      onLayout={onLayout}
      pointerEvents={exiting.current ? 'none' : 'auto'}
      style={[styles.root, rootStyle]}
    >
      <Animated.View style={iconStyle}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.Text style={[styles.wordmark, { top: wordmarkTop }, wordmarkStyle]}>
        Radiance
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    elevation: 999,
  },
  wordmark: {
    position: 'absolute',
    fontFamily: 'SFProRounded_Bold',
    fontSize: 28,
    letterSpacing: 1,
    color: COLORS.primary,
  },
});
