import React, { useState, useCallback, useMemo, useEffect } from "react";
import { StyleSheet } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { COLORS } from "../../constants/theme";
import { useSkinProfile } from "@/src/hooks/queries/useProfile";
import { useProductScanLimit } from "@/src/hooks/queries/useProducts";
import { useScanCredits } from "@/src/hooks/queries/useScanCredits";
import ScanModal from "../../components/scan/ScanModal";
import useAutoSubmitQuiz from "@/src/hooks/useAutoSubmitQuiz";
import { justOnboarded, removeJustOnboarded } from "@/src/lib/onboardingCache";
import { requestAppReview } from "@/src/lib/review";

export default function TabLayout() {
  const router = useRouter();
  useAutoSubmitQuiz(); // fallback retry for any quiz answers still cached locally
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const { data: skinProfile } = useSkinProfile();
  const { data: scanLimitData } = useProductScanLimit();
  const { data: scanCreditsData } = useScanCredits();

 useEffect(() => {
  let timer: ReturnType<typeof setTimeout>;

  (async () => {
    const onboarded = await justOnboarded();
    console.log("[review] justOnboarded =", onboarded);
    if (!onboarded) return;

    timer = setTimeout(async () => {
      try {
        await requestAppReview();
        console.log("[review] requested");
      } catch (e) {
        console.warn("[review] failed", e);
        return;                      // keep the flag so it can retry
      }
      await removeJustOnboarded();
    }, 2000);
  })();

  return () => clearTimeout(timer);
}, []);

  const faceScansLeft = useMemo(() => {
    if (!skinProfile?.faceScanWeekStart) return 2;
    const weekStart = new Date(skinProfile.faceScanWeekStart);
    const daysSince = (Date.now() - weekStart.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) return 2;
    return Math.max(0, 2 - (skinProfile.faceScanCountThisWeek ?? 0));
  }, [skinProfile?.faceScanWeekStart, skinProfile?.faceScanCountThisWeek]);

  const handleFaceScan = useCallback(() => {
    setScanModalVisible(false);
    router.push("/(onboarding)/face-scan");
  }, [router]);

  const handleCosmeticsScan = useCallback(() => {
    setScanModalVisible(false);
    router.push("/(tabs)/scan");
  }, [router]);

  return (
    <>
      <ScanModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
        onFaceScan={handleFaceScan}
        onCosmeticsScan={handleCosmeticsScan}
        faceScansLeft={faceScansLeft}
        faceCredits={scanCreditsData?.availableCredits ?? 0}
        productScansLeft={scanLimitData ? scanLimitData.scansRemaining : 10}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textTertiary,
          tabBarStyle: {
            position: "absolute",
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: "transparent",
            height: 88,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: "SFProRounded_Semibold",
          },
          tabBarBackground: () => (
            <BlurView
              tint="light"
              intensity={50}
              experimentalBlurMethod="dimezisBlurView"
              style={[
                StyleSheet.absoluteFill,
                { borderTopWidth: 0.5, borderTopColor: "rgba(255,255,255,0.5)" },
              ]}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Octicons name={focused ? "home-fill" : "home"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="routine"
          options={{
            title: "Routine",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: "Scan",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barcode-outline" size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setScanModalVisible(true);
            },
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarLabel: "Analytics",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-up-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "You",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}