import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { useAuth, useClerk } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile, useSkinProfile, useUpdateProfile } from "../../hooks/queries/useProfile";
import { uploadSkinPhoto } from "../../api/uploadPhoto";
import { useSkinLogs } from "../../hooks/queries/useSkinLogs";
import { useSkinScores } from "../../hooks/queries/useSkinScores";
import GlassCard from "../../components/ui/GlassCard";
import { COLORS } from "../../constants/theme";

function AnimatedDot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 16 : 6);
  const bgOpacity = useSharedValue(active ? 1 : 0.3);

  useEffect(() => {
    width.value = withSpring(active ? 16 : 6, { damping: 18, stiffness: 200 });
    bgOpacity.value = withTiming(active ? 1 : 0.3, { duration: 200 });
  }, [active]);

  const dotStyle = useAnimatedStyle(() => ({
    width: width.value,
    height: 6,
    borderRadius: 3,
    backgroundColor: `rgba(28, 28, 30, ${bgOpacity.value})`,
  }));

  return <Animated.View style={dotStyle} />;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: user } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: skinProfile } = useSkinProfile();
  const { data: skinLogs } = useSkinLogs();
  const { data: skinScores } = useSkinScores();
  const [monthOffset, setMonthOffset] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const memberDays = user?.createdAt
    ? Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    setAvatarUploading(true);
    try {
      const token = await getToken();
      const url = await uploadSkinPhoto(result.assets[0].uri, token!);
      updateProfile.mutate({ avatarUrl: url });
    } catch {
      Alert.alert("Upload failed", "Could not update your avatar. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          queryClient.cancelQueries();
          queryClient.clear();
          signOut();
        },
      },
    ]);
  };

  // Calendar swipe setup — 3 months centered on current offset
  const calendarListRef = useRef<FlatList>(null);
  const CALENDAR_WIDTH = Dimensions.get("window").width - 40; // paddingHorizontal 20 * 2
  const MONTHS_RANGE = 13; // 6 past + current + 6 future
  const CENTER_INDEX = 6;

  const getMonthData = useCallback(
    (offset: number) => {
      const now = new Date();
      const viewDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const monthName = viewDate.toLocaleString("default", { month: "long" });
      const startDow = (viewDate.getDay() + 6) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const logDates = new Set(
        (skinLogs ?? [])
          .map((l) => new Date(l.date))
          .filter((d) => d.getFullYear() === year && d.getMonth() === month)
          .map((d) => d.getDate()),
      );
      const scanDates = new Set(
        (skinScores ?? [])
          .map((s) => new Date(s.date))
          .filter((d) => d.getFullYear() === year && d.getMonth() === month)
          .map((d) => d.getDate()),
      );

      // Map day -> photo URL from skin logs that have photos
      const scanPhotos = new Map<number, string>();
      (skinLogs ?? []).forEach((l) => {
        if (!l.photoUrl) return;
        const d = new Date(l.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          scanPhotos.set(d.getDate(), l.photoUrl);
        }
      });

      const today = new Date();
      const isCurrentMonth =
        today.getFullYear() === year && today.getMonth() === month;
      const todayDate = isCurrentMonth ? today.getDate() : -1;

      return {
        year,
        month,
        monthName,
        startDow,
        daysInMonth,
        logDates,
        scanDates,
        scanPhotos,
        todayDate,
        offset,
      };
    },
    [skinLogs, skinScores],
  );

  const monthsList = useMemo(
    () => Array.from({ length: MONTHS_RANGE }, (_, i) => i - CENTER_INDEX),
    [],
  );

  const currentMonthData = useMemo(
    () => getMonthData(monthOffset),
    [monthOffset, getMonthData],
  );

  // Animated month title
  const titleOpacity = useSharedValue(1);
  const titleTranslateY = useSharedValue(0);
  const prevMonthOffset = useRef(monthOffset);

  useEffect(() => {
    if (prevMonthOffset.current !== monthOffset) {
      const direction = monthOffset > prevMonthOffset.current ? 1 : -1;
      titleOpacity.value = 0;
      titleTranslateY.value = direction * 12;
      titleOpacity.value = withTiming(1, { duration: 250 });
      titleTranslateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      prevMonthOffset.current = monthOffset;
    }
  }, [monthOffset]);

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const onCalendarScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / CALENDAR_WIDTH);
      const newOffset = monthsList[index];
      if (newOffset !== undefined && newOffset !== monthOffset) {
        setMonthOffset(newOffset);
      }
    },
    [CALENDAR_WIDTH, monthsList, monthOffset],
  );

  const personalItems: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[] = [
    { label: "My Skin Profile", icon: "happy-outline", onPress: () => router.push("/edit-skin-profile") },
    { label: "Routine Preferences", icon: "options-outline", onPress: () => router.push("/routine-preferences") },
    { label: "Routine for you", icon: "sparkles-outline", onPress: () => router.push("/(tabs)/routine") },
    { label: "My Shelf", icon: "layers-outline", onPress: () => router.push("/my-shelf") },
    { label: "Progress Tracking", icon: "sync-outline", onPress: () => router.push("/(tabs)/progress") },
  ];

  const helpItems: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }[] = [
    { label: "Frequently Asked Questions", icon: "help-circle-outline", onPress: () => router.push("/faq") },
    { label: "App Settings", icon: "settings-outline", onPress: () => router.push("/app-settings") },
    { label: "Contact us", icon: "chatbubble-ellipses-outline", onPress: () => router.push("/contact-us") },
  ];

  return (
    <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: "#F2F2F7" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <Animated.View entering={FadeInDown.duration(500).springify()} className="items-center py-8">
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7} style={{ position: "relative", marginBottom: 16 }}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "#F2F2F7",
                }}
              />
            ) : (
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: COLORS.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text className="text-[36px] font-poppins-bold text-white">
                  {initials}
                </Text>
              </View>
            )}
            {avatarUploading && (
              <View
                style={{
                  position: "absolute",
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="add" size={20} color={COLORS.text} />
            </View>
          </TouchableOpacity>
          <Text className="text-[26px] font-poppins-bold text-skin-text">
            {fullName || "Radiance User"}
          </Text>
          <Text className="text-sm text-skin-text-secondary mt-1">
            Radiance member · {memberDays} days
          </Text>
        </Animated.View>

        {/* Scans & Diary Calendar */}
        <Animated.View entering={FadeInDown.delay(150).duration(500).springify()}>
        <GlassCard style={{ marginBottom: 20 }} noPadding>
          {/* Calendar header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 20,
              marginBottom: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={COLORS.textSecondary}
              />
              <Animated.Text
                style={[{ fontSize: 16, fontWeight: "600", color: COLORS.text }, titleAnimStyle]}
              >
                Scans & Diary – {currentMonthData.monthName}
              </Animated.Text>
            </View>
          </View>

          {/* Day-of-week headers */}
          <View
            style={{
              flexDirection: "row",
              marginBottom: 8,
              paddingHorizontal: 20,
            }}
          >
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <View key={i} style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: COLORS.textTertiary,
                  }}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Swipeable calendar months */}
          <FlatList
            ref={calendarListRef}
            data={monthsList}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={CENTER_INDEX}
            getItemLayout={(_, index) => ({
              length: CALENDAR_WIDTH,
              offset: CALENDAR_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={onCalendarScroll}
            keyExtractor={(item) => `month-${item}`}
            renderItem={({ item: offset }) => {
              const data = getMonthData(offset);
              const cells: React.ReactNode[] = [];
              for (let i = 0; i < data.startDow; i++) {
                cells.push(
                  <View key={`empty-${i}`} style={{ flex: 1, height: 48 }} />,
                );
              }
              for (let day = 1; day <= data.daysInMonth; day++) {
                const isToday = day === data.todayDate;
                const hasLog = data.logDates.has(day);
                const hasScan = data.scanDates.has(day);
                const scanPhoto = data.scanPhotos.get(day);
                cells.push(
                  <View
                    key={day}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        backgroundColor: scanPhoto
                          ? "transparent"
                          : hasScan
                            ? COLORS.primary
                            : isToday
                              ? `${COLORS.primary}15`
                              : "transparent",
                      }}
                    >
                      {scanPhoto ? (
                        <>
                          <Image
                            source={{ uri: scanPhoto }}
                            style={{
                              position: "absolute",
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                            }}
                          />
                          <View
                            style={{
                              position: "absolute",
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: "rgba(0,0,0,0.2)",
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: "#fff",
                              zIndex: 1,
                            }}
                          >
                            {day}
                          </Text>
                        </>
                      ) : (
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: isToday || hasScan ? "700" : "400",
                            color: hasScan
                              ? "#fff"
                              : isToday
                                ? COLORS.primary
                                : COLORS.text,
                          }}
                        >
                          {day}
                        </Text>
                      )}
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 3,
                        height: 6,
                        marginTop: 2,
                      }}
                    >
                      {hasLog && !scanPhoto && (
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: COLORS.primary,
                          }}
                        />
                      )}
                    </View>
                  </View>,
                );
              }
              const rows: React.ReactNode[] = [];
              for (let i = 0; i < cells.length; i += 7) {
                const row = cells.slice(i, i + 7);
                const padCount = 7 - row.length;
                rows.push(
                  <View key={`row-${i}`} style={{ flexDirection: "row" }}>
                    {row}
                    {padCount > 0 &&
                      Array.from({ length: padCount }).map((_, j) => (
                        <View
                          key={`pad-${j}`}
                          style={{ flex: 1, height: 48 }}
                        />
                      ))}
                  </View>,
                );
              }
              return (
                <View style={{ width: CALENDAR_WIDTH, paddingHorizontal: 20 }}>
                  {rows}
                </View>
              );
            }}
          />

          {/* Bottom: nav hint + dots */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 16,
              paddingTop: 8,
            }}
          >
            <Pressable
              onPress={() => {
                const newOffset = monthOffset - 1;
                const newIndex = monthsList.indexOf(newOffset);
                if (newIndex >= 0) {
                  calendarListRef.current?.scrollToIndex({ index: newIndex, animated: true });
                  setMonthOffset(newOffset);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: "#000",
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Ionicons name="arrow-back" size={15} color="black" />
              <Animated.Text
                key={`prev-${monthOffset}`}
                entering={FadeIn.duration(250)}
                style={{ fontSize: 15, color: "#000", fontWeight: "600" }}
              >
                {new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + monthOffset - 1,
                  1,
                ).toLocaleString("default", { month: "short" })}
              </Animated.Text>
            </Pressable>
            {/* Page dots */}
            <View style={{ flexDirection: "row-reverse", gap: 6, alignItems: "center" }}>
              {[monthOffset, monthOffset + 1, monthOffset + 2].map((o) => (
                <AnimatedDot key={o} active={o === monthOffset} />
              ))}
            </View>
            <View style={{ width: 50 }} />
          </View>
        </GlassCard>
        </Animated.View>

        {/* Personal Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.textTertiary, letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
          PERSONAL
        </Text>
        <GlassCard noPadding style={{ marginBottom: 24 }}>
          {personalItems.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                paddingHorizontal: 18,
                gap: 14,
                borderBottomWidth: i < personalItems.length - 1 ? 1 : 0,
                borderBottomColor: "rgba(0,0,0,0.05)",
              }}
            >
              <Ionicons name={item.icon} size={20} color={COLORS.text} />
              <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: COLORS.text }}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </Pressable>
          ))}
        </GlassCard>
        </Animated.View>

        {/* Need Help Section */}
        <Animated.View entering={FadeInDown.delay(450).duration(500).springify()}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.textTertiary, letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
          NEED HELP?
        </Text>
        <GlassCard noPadding style={{ marginBottom: 24 }}>
          {helpItems.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                paddingHorizontal: 18,
                gap: 14,
                borderBottomWidth: i < helpItems.length - 1 ? 1 : 0,
                borderBottomColor: "rgba(0,0,0,0.05)",
              }}
            >
              <Ionicons name={item.icon} size={20} color={COLORS.text} />
              <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: COLORS.text }}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </Pressable>
          ))}
        </GlassCard>
        </Animated.View>

        {/* Legal Section */}
        <Animated.View entering={FadeInDown.delay(600).duration(500).springify()}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.textTertiary, letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
          LEGAL
        </Text>
        <GlassCard noPadding style={{ marginBottom: 24 }}>
          {["Privacy policy", "Money-back Policy", "Terms of Use"].map((label, i, arr) => (
            <Pressable
              key={label}
              onPress={() => {}}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                paddingHorizontal: 18,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: "rgba(0,0,0,0.05)",
              }}
            >
              <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: COLORS.text }}>
                {label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
            </Pressable>
          ))}
        </GlassCard>
        </Animated.View>

        {/* Log Out & Delete Account */}
        <Animated.View entering={FadeInDown.delay(750).duration(500).springify()}>
        <Pressable
          onPress={handleSignOut}
          style={{
            alignItems: "center",
            paddingVertical: 14,
            backgroundColor: "#fff",
            borderRadius: 16,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
            Log Out
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert("Delete Account", "Are you sure? This action cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => {} },
            ]);
          }}
          style={{
            alignItems: "center",
            paddingVertical: 14,
            backgroundColor: "rgba(0,0,0,0.03)",
            borderRadius: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "500", color: COLORS.textTertiary }}>
            Delete Account
          </Text>
        </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
