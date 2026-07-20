import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlassCard from "../components/ui/GlassCard";
import GlassIconButton from "../components/ui/GlassIconButton";
import { COLORS } from "../constants/theme";

const STORAGE_KEY = "radiance_app_settings";

interface Settings {
  pushNotifications: boolean;
  routineReminders: boolean;
  weeklyProgress: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  pushNotifications: true,
  routineReminders: true,
  weeklyProgress: true,
};

export default function AppSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const updateSetting = useCallback(
    (key: keyof Settings, value: boolean) => {
      const next = { ...settings, [key]: value };
      setSettings(next);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [settings],
  );

  const handleClearCache = () => {
    Alert.alert(
      "Clear Cache",
      "This will clear locally cached data. Your account and skin profile will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const keysToKeep = [STORAGE_KEY];
            const allKeys = await AsyncStorage.getAllKeys();
            const keysToRemove = allKeys.filter(
              (k) => !keysToKeep.includes(k),
            );
            if (keysToRemove.length > 0) {
              await AsyncStorage.multiRemove(keysToRemove);
            }
            Alert.alert("Done", "Cache cleared successfully.");
          },
        },
      ],
    );
  };

  if (!loaded) return null;

  const notificationRows: {
    label: string;
    key: keyof Settings;
    description: string;
  }[] = [
    {
      label: "Push Notifications",
      key: "pushNotifications",
      description: "Receive general app notifications",
    },
    {
      label: "Routine Reminders",
      key: "routineReminders",
      description: "Get reminded to complete your AM/PM routines",
    },
    {
      label: "Weekly Progress",
      key: "weeklyProgress",
      description: "Receive a weekly skin progress summary",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 12,
            gap: 14,
          }}
        >
          <GlassIconButton
            icon="chevron-back"
            onPress={() => router.back()}
            iconSize={22}
          />
          <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}>
            App Settings
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Notifications */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: COLORS.textTertiary,
                letterSpacing: 0.5,
                marginBottom: 8,
                marginLeft: 4,
              }}
            >
              NOTIFICATIONS
            </Text>
            <GlassCard noPadding style={{ marginBottom: 24 }}>
              {notificationRows.map((row, i) => (
                <View
                  key={row.key}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                    borderBottomWidth:
                      i < notificationRows.length - 1 ? 1 : 0,
                    borderBottomColor: "rgba(0,0,0,0.05)",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "500",
                        color: COLORS.text,
                      }}
                    >
                      {row.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: COLORS.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {row.description}
                    </Text>
                  </View>
                  <Switch
                    value={settings[row.key]}
                    onValueChange={(v) => updateSetting(row.key, v)}
                    trackColor={{
                      false: COLORS.border,
                      true: COLORS.primary,
                    }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </GlassCard>
          </Animated.View>

          {/* About */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: COLORS.textTertiary,
                letterSpacing: 0.5,
                marginBottom: 8,
                marginLeft: 4,
              }}
            >
              ABOUT
            </Text>
            <GlassCard noPadding style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(0,0,0,0.05)",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "500",
                    color: COLORS.text,
                  }}
                >
                  App Version
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: COLORS.textSecondary,
                  }}
                >
                  1.0.0
                </Text>
              </View>
              <View
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: COLORS.error,
                  }}
                  onPress={handleClearCache}
                >
                  Clear Cache
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
