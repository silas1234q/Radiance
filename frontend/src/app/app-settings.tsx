import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlassCard from "../components/ui/GlassCard";
import CircleIconButton from "../components/ui/CircleIconButton";
import { COLORS } from "../constants/theme";
import { useRevenueCat } from "../providers/RevenueCatProvider";
import { useNotificationSettings } from "../hooks/useNotificationSettings";
import {
  NOTIFICATION_SETTINGS_KEY,
  NotificationSettings,
  formatTime,
  requestNotificationPermission,
  timeToDate,
} from "../lib/notifications";

/** Notification keys that require the OS permission before they do anything. */
const PERMISSION_KEYS: (keyof NotificationSettings)[] = [
  "pushNotifications",
  "routineReminders",
  "dailyLog",
  "streakProtection",
  "weeklyProgress",
];

type TimeKey = "amTime" | "pmTime" | "logTime";

export default function AppSettingsScreen() {
  const router = useRouter();
  const { isPro, presentCustomerCenter, restore } = useRevenueCat();
  const { settings, loaded, update } = useNotificationSettings();
  const [restoring, setRestoring] = useState(false);
  const [activePicker, setActivePicker] = useState<TimeKey | null>(null);

  const toggle = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      // Turning a notification feature ON needs OS permission first.
      if (value && PERMISSION_KEYS.includes(key)) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          Alert.alert(
            "Notifications are off",
            "Enable notifications for Radiance in your device Settings to use reminders.",
          );
          return;
        }
      }
      update(key, value);
    },
    [update],
  );

  const onPickTime = useCallback(
    (key: TimeKey, event: DateTimePickerEvent, date?: Date) => {
      // Android fires with type "dismissed" on cancel; iOS keeps the picker open.
      if (Platform.OS === "android") setActivePicker(null);
      if (event.type === "dismissed" || !date) return;
      update(key, formatTime(date));
    },
    [update],
  );

  const handleRestore = useCallback(async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const success = await restore();
      Alert.alert(
        success ? "Purchases Restored" : "Nothing to Restore",
        success
          ? "Your Radiance Pro subscription is active again."
          : "We couldn't find an active subscription for this account.",
      );
    } finally {
      setRestoring(false);
    }
  }, [restore, restoring]);

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
            const keysToKeep = [NOTIFICATION_SETTINGS_KEY];
            const allKeys = await AsyncStorage.getAllKeys();
            const keysToRemove = allKeys.filter((k) => !keysToKeep.includes(k));
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

  const pushOn = settings.pushNotifications;

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
          <CircleIconButton icon="chevron-back" onPress={() => router.back()} />
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
            <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
            <GlassCard noPadding style={{ marginBottom: 24 }}>
              <ToggleRow
                label="Push Notifications"
                description="Master switch for all Radiance notifications"
                value={settings.pushNotifications}
                onValueChange={(v) => toggle("pushNotifications", v)}
              />

              <ToggleRow
                label="Routine Reminders"
                description="Get reminded to complete your AM/PM routines"
                value={settings.routineReminders}
                disabled={!pushOn}
                onValueChange={(v) => toggle("routineReminders", v)}
              />
              {pushOn && settings.routineReminders && (
                <>
                  <TimeRow
                    label="Morning reminder"
                    time={settings.amTime}
                    onPress={() => setActivePicker("amTime")}
                  />
                  <TimeRow
                    label="Evening reminder"
                    time={settings.pmTime}
                    onPress={() => setActivePicker("pmTime")}
                  />
                </>
              )}

              <ToggleRow
                label="Daily Log Reminder"
                description="Evening nudge to log your mood & skin"
                value={settings.dailyLog}
                disabled={!pushOn}
                onValueChange={(v) => toggle("dailyLog", v)}
              />
              {pushOn && (settings.dailyLog || settings.streakProtection) && (
                <TimeRow
                  label="Evening reminder time"
                  time={settings.logTime}
                  onPress={() => setActivePicker("logTime")}
                />
              )}

              <ToggleRow
                label="Streak Protection"
                description="Warn me in the evening when my streak is at risk"
                value={settings.streakProtection}
                disabled={!pushOn}
                onValueChange={(v) => toggle("streakProtection", v)}
              />

              <ToggleRow
                label="Weekly Progress"
                description="Receive a weekly skin progress summary"
                value={settings.weeklyProgress}
                disabled={!pushOn}
                onValueChange={(v) => toggle("weeklyProgress", v)}
                isLast
              />
            </GlassCard>
          </Animated.View>

          {/* Subscription */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
            <GlassCard noPadding style={{ marginBottom: 24 }}>
              {/* Status */}
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
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: "500", color: COLORS.text }}
                  >
                    Radiance Pro
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}
                  >
                    {isPro ? "Your subscription is active" : "Not subscribed"}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: isPro ? COLORS.primaryLight : COLORS.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: isPro ? COLORS.primaryDark : COLORS.textSecondary,
                    }}
                  >
                    {isPro ? "ACTIVE" : "FREE"}
                  </Text>
                </View>
              </View>

              {/* Manage Subscription — RevenueCat Customer Center */}
              <Pressable
                onPress={presentCustomerCenter}
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
                  style={{ flex: 1, fontSize: 15, fontWeight: "500", color: COLORS.text }}
                >
                  Manage Subscription
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textTertiary}
                />
              </Pressable>

              {/* Restore Purchases */}
              <Pressable
                onPress={handleRestore}
                disabled={restoring}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  opacity: restoring ? 0.5 : 1,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "500", color: COLORS.text }}>
                  {restoring ? "Restoring…" : "Restore Purchases"}
                </Text>
              </Pressable>
            </GlassCard>
          </Animated.View>

          {/* About */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
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
                <Text style={{ fontSize: 15, color: COLORS.textSecondary }}>
                  1.0.0
                </Text>
              </View>
              <View style={{ paddingVertical: 14, paddingHorizontal: 18 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: "500", color: COLORS.error }}
                  onPress={handleClearCache}
                >
                  Clear Cache
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        </ScrollView>

        {/* iOS: the spinner has no built-in dismiss, so present it in a sheet
            with a Done bar. Android uses its native dialog (own OK/Cancel). */}
        {activePicker && Platform.OS === "ios" && (
          <Modal
            transparent
            animationType="slide"
            visible
            onRequestClose={() => setActivePicker(null)}
          >
            <Pressable
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
              onPress={() => setActivePicker(null)}
            />
            <View style={{ backgroundColor: "#fff", paddingBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Pressable onPress={() => setActivePicker(null)} hitSlop={8}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: COLORS.primary,
                    }}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={timeToDate(settings[activePicker])}
                mode="time"
                display="spinner"
                textColor={COLORS.text}
                themeVariant="light"
                style={{ height: 216, backgroundColor: "#fff" }}
                onChange={(e, d) => onPickTime(activePicker, e, d)}
              />
            </View>
          </Modal>
        )}

        {activePicker && Platform.OS !== "ios" && (
          <DateTimePicker
            value={timeToDate(settings[activePicker])}
            mode="time"
            display="default"
            onChange={(e, d) => onPickTime(activePicker, e, d)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
  isLast,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: COLORS.text }}>
          {label}
        </Text>
        <Text
          style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}
        >
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

function TimeRow({
  label,
  time,
  onPress,
}: {
  label: string;
  time: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 18,
        paddingLeft: 34,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
      }}
    >
      <Text
        style={{ flex: 1, fontSize: 14, color: COLORS.textSecondary }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: COLORS.primary }}
        >
          {time}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
      </View>
    </Pressable>
  );
}

const styles = {
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
};
