import React, { useState, useCallback } from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { COLORS } from "../../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useProfile } from "@/src/hooks/queries/useProfile";
import ScanModal from "../../components/scan/ScanModal";


export default function TabLayout() {
  const router = useRouter();
  const [scanModalVisible, setScanModalVisible] = useState(false);

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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: "Routine",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </>
  );
}
