import React from "react";
import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import GlassCard from "../components/ui/GlassCard";
import CircleIconButton from "../components/ui/CircleIconButton";
import { COLORS } from "../constants/theme";

const SUPPORT_EMAIL = "support@radianceapp.com";

const contactOptions: {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  subject: string;
}[] = [
  {
    label: "Email Support",
    description: "Get help with your account or app features",
    icon: "mail-outline",
    subject: "Support Request",
  },
  {
    label: "Report a Bug",
    description: "Let us know about something that isn't working",
    icon: "bug-outline",
    subject: "Bug Report",
  },
];

export default function ContactUsScreen() {
  const router = useRouter();

  const handleContact = (subject: string) => {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(mailto);
  };

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
            Contact Us
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Contact Options */}
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
              GET IN TOUCH
            </Text>
            <GlassCard noPadding style={{ marginBottom: 24 }}>
              {contactOptions.map((option, i) => (
                <Pressable
                  key={option.label}
                  onPress={() => handleContact(option.subject)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 16,
                    paddingHorizontal: 18,
                    gap: 14,
                    borderBottomWidth:
                      i < contactOptions.length - 1 ? 1 : 0,
                    borderBottomColor: "rgba(0,0,0,0.05)",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: `${COLORS.primary}15`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "500",
                        color: COLORS.text,
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: COLORS.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {option.description}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.textTertiary}
                  />
                </Pressable>
              ))}
            </GlassCard>
          </Animated.View>

          {/* Response Time */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <GlassCard
              style={{
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Ionicons
                name="time-outline"
                size={24}
                color={COLORS.textSecondary}
                style={{ marginBottom: 8 }}
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: COLORS.text,
                  marginBottom: 4,
                }}
              >
                Response Time
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                We typically respond within 24-48 hours.{"\n"}Thank you for your
                patience!
              </Text>
            </GlassCard>
          </Animated.View>

          {/* Email display */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <GlassCard style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 13,
                  color: COLORS.textTertiary,
                  marginBottom: 4,
                }}
              >
                Email us directly at
              </Text>
              <Pressable onPress={() => handleContact("General Inquiry")}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: COLORS.primary,
                  }}
                >
                  {SUPPORT_EMAIL}
                </Text>
              </Pressable>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
