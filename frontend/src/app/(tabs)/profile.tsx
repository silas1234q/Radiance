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
  Modal,
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
import {
  useProfile,
  useSkinProfile,
  useUpdateProfile,
  useDeleteAccount,
} from "../../hooks/queries/useProfile";
import { uploadSkinPhoto } from "../../api/uploadPhoto";
import { useSkinLogs } from "../../hooks/queries/useSkinLogs";
import { useSkinScores } from "../../hooks/queries/useSkinScores";
import GlassCard from "../../components/ui/GlassCard";
import { COLORS } from "../../constants/theme";
import { toast } from "../../lib/toast";
import { emitSessionExpired, suppressSessionExpiry } from "../../lib/sessionExpiry";

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
  const deleteAccount = useDeleteAccount();
  const { data: skinLogs } = useSkinLogs();
  const { data: skinScores } = useSkinScores();
  const [monthOffset, setMonthOffset] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

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
      toast.info("Please allow access to your photo library.", { title: "Permission needed" });
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
      if (!token) { emitSessionExpired(); return; }
      const url = await uploadSkinPhoto(result.assets[0].uri, token);
      updateProfile.mutate({ avatarUrl: url });
    } catch {
      toast.error("Could not update your avatar. Please try again.", { title: "Upload failed" });
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
        onPress: async () => {
          setSigningOut(true);
          suppressSessionExpiry();
          try {
            queryClient.cancelQueries();
            queryClient.clear();
            await signOut();
          } catch {
            setSigningOut(false);
            toast.error("Could not sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (deleteAccount.isPending) return;
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all of your data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount.mutateAsync();
              suppressSessionExpiry();
              queryClient.cancelQueries();
              queryClient.clear();
              await signOut();
            } catch {
              Alert.alert(
                "Delete failed",
                "We couldn't delete your account. Please try again.",
              );
            }
          },
        },
      ],
    );
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
          {([
            { label: "Privacy Policy", onPress: () => setLegalModal('privacy') },
            { label: "Terms of Use", onPress: () => setLegalModal('terms') },
          ] as const).map((item, i, arr) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
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
                {item.label}
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
          disabled={signingOut}
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            paddingVertical: 14,
            backgroundColor: "#fff",
            borderRadius: 16,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
            opacity: signingOut ? 0.6 : 1,
          }}
        >
          {signingOut && <ActivityIndicator size="small" color={COLORS.text} />}
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
            {signingOut ? "Signing out…" : "Log Out"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleDeleteAccount}
          disabled={deleteAccount.isPending}
          style={{
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            paddingVertical: 14,
            backgroundColor: "rgba(0,0,0,0.03)",
            borderRadius: 16,
            marginBottom: 16,
            opacity: deleteAccount.isPending ? 0.6 : 1,
          }}
        >
          {deleteAccount.isPending && (
            <ActivityIndicator size="small" color={COLORS.textTertiary} />
          )}
          <Text style={{ fontSize: 16, fontWeight: "500", color: COLORS.textTertiary }}>
            {deleteAccount.isPending ? "Deleting…" : "Delete Account"}
          </Text>
        </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Legal Modals */}
      <Modal
        visible={legalModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalModal(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 52 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.text }}>
              {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
            </Text>
            <Pressable
              onPress={() => setLegalModal(null)}
              hitSlop={12}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={18} color={COLORS.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {legalModal === 'privacy' ? <PrivacyPolicyContent /> : <TermsOfUseContent />}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 24, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function Paragraph({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 14, lineHeight: 22, color: COLORS.textSecondary, marginBottom: 12 }}>
      {children}
    </Text>
  );
}

function PrivacyPolicyContent() {
  return (
    <View>
      <Text style={{ fontSize: 12, color: COLORS.textTertiary, marginTop: 8, marginBottom: 16 }}>
        Last updated: August 2026
      </Text>

      <Paragraph>
        Radiance ("we", "us", or "our") respects your privacy and is committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, and safeguard your information when you use the Radiance mobile application.
      </Paragraph>

      <SectionTitle>1. Information We Collect</SectionTitle>
      <Paragraph>
        Account information: When you create an account, we collect your name, email address, and authentication credentials via our authentication provider (Clerk).
      </Paragraph>
      <Paragraph>
        Skin data: We collect the information you provide through our skin quiz (skin type, concerns, sensitivities) and, if you opt in, facial photos for skin analysis. Photos are processed to generate your skin score and metrics, then stored securely.
      </Paragraph>
      <Paragraph>
        Usage data: We collect information about how you interact with the app, including routine completions, mood logs, and skin log entries, to personalize your experience and track your progress.
      </Paragraph>

      <SectionTitle>2. How We Use Your Information</SectionTitle>
      <Paragraph>
        We use your information to provide personalized skin analysis and routine recommendations, track your skin health progress over time, send you reminders and notifications (with your permission), improve our AI-powered analysis and recommendations, and process subscriptions and purchases.
      </Paragraph>

      <SectionTitle>3. Photo Storage & Processing</SectionTitle>
      <Paragraph>
        Facial photos you capture are uploaded securely to our cloud storage provider (Cloudinary) and processed by our skin analysis service. Photos are used solely for your skin analysis and are never shared with other users or third parties for marketing purposes.
      </Paragraph>

      <SectionTitle>4. Third-Party Services</SectionTitle>
      <Paragraph>
        We use the following third-party services: Clerk for authentication, Cloudinary for secure photo storage, OpenAI for AI-powered skin analysis, RevenueCat for subscription management, and Expo for push notifications. Each service processes data in accordance with their own privacy policies.
      </Paragraph>

      <SectionTitle>5. Data Retention & Deletion</SectionTitle>
      <Paragraph>
        You can delete your account and all associated data at any time from the Profile screen. When you delete your account, all your personal data, skin profiles, photos, logs, and routines are permanently removed from our systems.
      </Paragraph>

      <SectionTitle>6. Security</SectionTitle>
      <Paragraph>
        We implement industry-standard security measures including encrypted data transmission (TLS), secure token-based authentication, and access controls to protect your personal information.
      </Paragraph>

      <SectionTitle>7. Contact Us</SectionTitle>
      <Paragraph>
        If you have any questions about this Privacy Policy, please contact us through the Contact Us section in the app.
      </Paragraph>
    </View>
  );
}

function TermsOfUseContent() {
  return (
    <View>
      <Text style={{ fontSize: 12, color: COLORS.textTertiary, marginTop: 8, marginBottom: 16 }}>
        Last updated: August 2026
      </Text>

      <Paragraph>
        Welcome to Radiance. By using our mobile application, you agree to be bound by these Terms of Use. Please read them carefully before using the app.
      </Paragraph>

      <SectionTitle>1. Acceptance of Terms</SectionTitle>
      <Paragraph>
        By accessing or using Radiance, you agree to these Terms of Use and our Privacy Policy. If you do not agree, please do not use the app.
      </Paragraph>

      <SectionTitle>2. Description of Service</SectionTitle>
      <Paragraph>
        Radiance is an AI-powered skincare application that provides personalized skin analysis, routine recommendations, and progress tracking. Our analysis is for informational purposes only and does not constitute medical advice.
      </Paragraph>

      <SectionTitle>3. Not Medical Advice</SectionTitle>
      <Paragraph>
        Radiance is not a medical device and does not provide medical diagnoses or treatment recommendations. The skin analysis, scores, and routine suggestions are generated by AI and should not replace professional dermatological advice. Always consult a qualified healthcare provider for skin conditions or concerns.
      </Paragraph>

      <SectionTitle>4. Accounts</SectionTitle>
      <Paragraph>
        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when creating your account and keep it up to date.
      </Paragraph>

      <SectionTitle>5. Subscriptions & Purchases</SectionTitle>
      <Paragraph>
        Some features require a Radiance Pro subscription. Subscriptions are billed through the Apple App Store or Google Play Store and are subject to their respective terms. Subscriptions auto-renew unless canceled at least 24 hours before the end of the current billing period. You can manage and cancel subscriptions in your device settings.
      </Paragraph>

      <SectionTitle>6. User Content</SectionTitle>
      <Paragraph>
        You retain ownership of the photos and data you submit to Radiance. By uploading content, you grant us a limited license to process and store it for the purpose of providing our services to you.
      </Paragraph>

      <SectionTitle>7. Prohibited Uses</SectionTitle>
      <Paragraph>
        You agree not to use Radiance to violate any laws, upload harmful or inappropriate content, attempt to gain unauthorized access to our systems, or use the app in any way that could damage or impair its functionality.
      </Paragraph>

      <SectionTitle>8. Limitation of Liability</SectionTitle>
      <Paragraph>
        Radiance is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the app, including but not limited to skin reactions from following routine recommendations. Use the app at your own discretion.
      </Paragraph>

      <SectionTitle>9. Changes to Terms</SectionTitle>
      <Paragraph>
        We may update these Terms of Use from time to time. Continued use of the app after changes constitutes acceptance of the updated terms.
      </Paragraph>

      <SectionTitle>10. Contact Us</SectionTitle>
      <Paragraph>
        If you have any questions about these Terms, please contact us through the Contact Us section in the app.
      </Paragraph>
    </View>
  );
}
