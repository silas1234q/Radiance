import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import CircleIconButton from "../components/ui/CircleIconButton";
import { useSkinProfile } from "../hooks/queries/useProfile";
import { useSkinScores } from "../hooks/queries/useSkinScores";
import { useGamification } from "../hooks/queries/useGamification";
import { buildAiInsight, buildEarnedBadges } from "../lib/skinSummary";
import { COLORS } from "../constants/theme";
import Fire from "@/src/assets/images/fire.png";

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? "#34C759" : pct >= 40 ? "#FF9500" : COLORS.primary;
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color }]}>{Math.round(pct)}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function SkinSummaryScreen() {
  const router = useRouter();
  const { data: profile } = useSkinProfile();
  const { data: scores } = useSkinScores();
  const { data: gamification } = useGamification();

  const insight = useMemo(() => buildAiInsight(scores, gamification), [scores, gamification]);
  const badges = useMemo(() => buildEarnedBadges(profile, gamification), [profile, gamification]);

  const score = profile?.skinScore ?? 0;
  const streak = gamification?.currentStreak ?? 0;
  const level = gamification?.glowLevel?.label;
  const summaryText = (profile?.aiAnalysisRaw as { summary?: string } | null)?.summary;
  const concerns = (profile?.concerns as string[] | undefined) ?? [];

  const metrics = [
    { label: "Hydration", value: profile?.hydration ?? 0 },
    { label: "Oil Balance", value: profile?.oilBalance ?? 0 },
    { label: "Texture", value: profile?.texture ?? 0 },
    { label: "Even Tone", value: profile?.evenTone ?? 0 },
    { label: "Sensitivity", value: profile?.sensitivity ?? 0 },
  ];

  const traits = [
    profile?.skinType,
    profile?.sensitivityLevel,
    profile?.skinTone ? `${profile.skinTone} tone` : null,
    profile?.skinAge ? `Skin age ${profile.skinAge}` : null,
  ].filter(Boolean) as string[];

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      {/* Sticky header with a fade-out gradient (matches Skin Diary modal) */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
        pointerEvents="box-none"
      >
        <LinearGradient
          colors={["rgba(242,242,247,0.92)", "rgba(242,242,247,0)"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 96, zIndex: 0 }}
          pointerEvents="none"
        />
        <SafeAreaView edges={["top"]} pointerEvents="box-none">
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 24, zIndex: 1 }}>
            <View
              style={{
                width: 36,
                height: 5,
                borderRadius: 3,
                backgroundColor: "rgba(0,0,0,0.15)",
                marginBottom: 12,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                paddingHorizontal: 24,
              }}
            >
              <View style={{ width: 40 }} />
              <Text
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 20,
                  fontFamily: "SFProRounded_Bold",
                  color: COLORS.text,
                }}
              >
                Skin Summary
              </Text>
              <CircleIconButton icon="close" onPress={() => router.back()} />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 112, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
          {/* Score hero */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.hero}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Skin Health Score</Text>
              <Text style={styles.heroScore}>{score}</Text>
              {level ? <Text style={styles.heroLevel}>{level}</Text> : null}
            </View>
            <View style={styles.streakPill}>
              <Image source={Fire} style={{ width: 16, height: 16, marginRight: 5 }} />
              <Text style={styles.streakText}>{streak} day streak</Text>
            </View>
          </Animated.View>

          {/* Analysis summary */}
          {summaryText ? (
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <Section title="Your Analysis">
                <Text style={styles.bodyText}>{summaryText}</Text>
              </Section>
            </Animated.View>
          ) : null}

          {/* This week's insight */}
          <Animated.View entering={FadeInDown.delay(140).duration(400)}>
            <View style={[styles.card, { flexDirection: "row", gap: 12, alignItems: "flex-start" }]}>
              <View style={styles.insightIcon}>
                <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>This Week</Text>
                <Text style={styles.bodyText}>{insight}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Metrics */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Section title="Skin Metrics">
              {metrics.map((m) => (
                <MetricBar key={m.label} label={m.label} value={m.value} />
              ))}
            </Section>
          </Animated.View>

          {/* Skin profile traits */}
          {traits.length > 0 && (
            <Animated.View entering={FadeInDown.delay(260).duration(400)}>
              <Section title="Skin Profile">
                <View style={styles.chipRow}>
                  {traits.map((t) => (
                    <View key={t} style={styles.chip}>
                      <Text style={styles.chipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </Section>
            </Animated.View>
          )}

          {/* Priority concerns */}
          {concerns.length > 0 && (
            <Animated.View entering={FadeInDown.delay(320).duration(400)}>
              <Section title="Priority Concerns">
                <View style={styles.chipRow}>
                  {concerns.map((c) => (
                    <View key={c} style={styles.concernChip}>
                      <Text style={styles.concernChipText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </Section>
            </Animated.View>
          )}

          {/* Achievements */}
          {badges.length > 0 && (
            <Animated.View entering={FadeInDown.delay(380).duration(400)}>
              <Section title="Achievements">
                <View style={styles.chipRow}>
                  {badges.map((b) => (
                    <View
                      key={b.label}
                      style={[styles.badge, { backgroundColor: `${b.color}18` }]}
                    >
                      <Ionicons
                        name={b.icon as keyof typeof Ionicons.glyphMap}
                        size={14}
                        color={b.color}
                      />
                      <Text style={[styles.badgeText, { color: b.color }]}>{b.label}</Text>
                    </View>
                  ))}
                </View>
              </Section>
            </Animated.View>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  heroLabel: { fontSize: 12.5, fontFamily: "SFProRounded_Medium", color: COLORS.textSecondary },
  heroScore: {
    fontSize: 44,
    fontFamily: "SFProRounded_Bold",
    color: COLORS.text,
    letterSpacing: -1,
    lineHeight: 50,
  },
  heroLevel: { fontSize: 13, fontFamily: "SFProRounded_Semibold", color: COLORS.primary },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  streakText: { fontSize: 13, fontFamily: "SFProRounded_Semibold", color: COLORS.primaryDark },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "SFProRounded_Bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: "SFProRounded_Regular",
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: { fontSize: 13.5, fontFamily: "SFProRounded_Medium", color: COLORS.text },
  metricValue: { fontSize: 13.5, fontFamily: "SFProRounded_Bold" },
  track: { height: 7, borderRadius: 4, backgroundColor: "#EFEFF4", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { fontSize: 13, fontFamily: "SFProRounded_Medium", color: COLORS.text },
  concernChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  concernChipText: { fontSize: 13, fontFamily: "SFProRounded_Semibold", color: COLORS.primary },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontFamily: "SFProRounded_Semibold" },
});
