import { Text, View, Image, Pressable, ImageBackground, StyleSheet } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Logo from "@/src/assets/images/icon.png";
import BackgroundImage from "@/src/assets/images/imageBackground2.png";
import { markWelcomeSeen } from "../lib/welcomeCache";
import { triggerHapticFeedback } from "../constants/haptics";
import { COLORS } from "../constants/theme";
import WelcomeCards from "../components/WelcomeCards";

type Destination = "/(onboarding)/quiz" | "/(screens)/auth";

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Marked on tap rather than on mount, so someone who force-quits straight
  // away still sees the welcome screen next time.
  const go = (path: Destination) => {
    triggerHapticFeedback("impact");
    markWelcomeSeen();
    router.push(path as never);
  };

  return (
    <ImageBackground
      source={BackgroundImage}
      resizeMode="cover"
      className="flex-1 flex-row justify-between"
    >
      <BlurView
        className="w-[50%] justify-between px-5"
        intensity={20}
        tint="dark"
        style={{
          paddingVertical: insets.top + 10,
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: "white",
        }}
      >
        <View className="flex-row items-center gap-3">
          <Image source={Logo} className="w-12 h-12 rounded-sm" />
          <Text className="text-3xl font-sans-semibold text-white">
            Radiance
          </Text>
        </View>

        <View className="mb-16">
          <Text className="text-4xl font-sans-semibold text-white leading-[42px] ">
            Your best skin, naturally
          </Text>
          <View className="flex-row gap-3 items-stretch mb-16 mt-5">
            <View className="w-1 bg-gray-100 rounded-full" />
            <Text className="text-gray-100 flex-1">
              Personalized care for healthier, glowing skin.
            </Text>
          </View>
        </View>
      </BlurView>

      <View
        className="w-1/2 justify-between px-3"
        style={{ paddingBottom: insets.bottom }}
      >
        <View />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start your skin quiz"
          className="bg-primary-dark py-3 rounded-full flex-row justify-between px-3 items-center mb-16 active:opacity-80"
          onPress={() => go("/(onboarding)/quiz")}
        >
          <Text className="text-white text-xl">Start your quiz</Text>
          <View className="bg-white w-12 h-12 rounded-full items-center justify-center">
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.primaryDark}
            />
          </View>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log in to your existing account"
        hitSlop={12}
        className="absolute left-0 right-0 items-center"
        style={{ bottom: insets.bottom + 12 }}
        onPress={() => go("/(screens)/auth")}
      >
        <Text className="text-gray-100">
          Already have an account?{" "}
          <Text className="font-sans-semibold text-white underline">
            Log in
          </Text>
        </Text>
      </Pressable>

      <WelcomeCards />
    </ImageBackground>
  );
}