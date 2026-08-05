import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Image, Modal, ScrollView } from "react-native";
import { useSSO, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { toast } from "@/src/lib/toast";
import { getErrorMessage } from "@/src/lib/errors";
import Svg, { Path } from "react-native-svg";
import GoogleLogo from '@/src/assets/images/googleimage.png'
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/src/constants/theme";
import CircleIconButton from "@/src/components/ui/CircleIconButton";

export default function AuthScreen() {
  const { startSSOFlow } = useSSO();
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(null);

  const handleOAuth = async (strategy: "oauth_apple" | "oauth_google") => {
    setLoading(strategy === "oauth_apple" ? "apple" : "google");
    try {
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy,
      });

      const sessionId =
        createdSessionId ?? signIn?.createdSessionId ?? signUp?.createdSessionId;

      if (sessionId && setActive) {
        await setActive({ session: sessionId });
        setLoading(null);

        // Route immediately — returning users (signIn) go to tabs,
        // new users (signUp) go to quiz. AuthRouter will correct if needed.
        const isReturning =
          sessionId === signIn?.createdSessionId &&
          sessionId !== signUp?.createdSessionId;
        const isOnboarded = isReturning || !!user?.publicMetadata?.onboarded;
        router.replace(isOnboarded ? "/(tabs)" : "/(onboarding)/quiz");
      } else {
        setLoading(null);
      }
    } catch (err: unknown) {
      console.log("SSO Error:", JSON.stringify(err, null, 2));
      const clerkErr = err as { errors?: { code?: string; message?: string }[] };
      if (clerkErr?.errors?.[0]?.code !== "session_exists") {
        toast.error(getErrorMessage(err, "Sign in failed"));
      }
      setLoading(null);
    }
  };

  return (
    <View className="flex-1 bg-white px-[30px] pb-10 justify-between">
      <View style={{ flex: 0.3 }} />

      <View className="items-center">
        <View
          className="w-24 h-24 rounded-[30px] bg-primary items-center justify-center mb-[30px] shadow-primary"
          style={{
            shadowColor: '#F06680',
            shadowOffset: { width: 0, height: 18 }, 
            shadowOpacity: 0.55,
            shadowRadius: 40,
            elevation: 12,
          }}
        >
          <Svg width={46} height={46} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2.5c3.2 4.2 6.2 7.2 6.2 11.1A6.2 6.2 0 0 1 12 19.8a6.2 6.2 0 0 1-6.2-6.2C5.8 9.7 8.8 6.7 12 2.5z"
              fill="#fff"
            />
            <Path
              d="M9.4 13.6a2.6 2.6 0 0 0 2.6 2.6"
              stroke="#FF5A5F"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          </Svg>
        </View>
        <Text className="text-[52px] font-poppins-extrabold tracking-[-2px] text-skin-text">
          Radiance
        </Text>
        <Text className="text-[21px] font-poppins-semibold text-skin-text mt-[18px] max-w-[260px] text-center leading-[27px]">
          Skincare that actually understands your skin
        </Text>
        <Text className="text-base text-skin-text-secondary mt-3 max-w-[250px] text-center leading-[22px]">
          Answer a few questions and we'll build a routine around you.
        </Text>
      </View>

      <View className="items-center gap-4">
        <Pressable
          className="w-full h-[54px] rounded-xl bg-black flex-row items-center justify-center gap-2.5"
          style={loading ? { opacity: 0.6 } : undefined}
          disabled={!!loading}
          onPress={() => handleOAuth("oauth_apple")}
        >
          {loading === "apple" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons  name={'logo-apple'} color="white" size={18}/>
              <Text className="text-base font-poppins-semibold text-white">
                Continue with Apple
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          className="w-full h-[54px] rounded-xl bg-white border-[1.5px] border-skin-border flex-row items-center justify-center gap-2.5"
          style={loading ? { opacity: 0.6 } : undefined}
          disabled={!!loading}
          onPress={() => handleOAuth("oauth_google")}
        >
          {loading === "google" ? (
            <ActivityIndicator color="#1C1C1E" />
          ) : (
            <>
               <Image source={GoogleLogo} className="w-6 h-6"/>
              <Text className="text-base font-poppins-semibold text-skin-text">
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        <Text className="text-[13px] text-skin-text-tertiary font-poppins text-center leading-[18px]">
          By continuing, you agree to our{' '}
          <Text
            onPress={() => setLegalModal('terms')}
            style={{ textDecorationLine: 'underline' }}
          >
            Terms of Use
          </Text>
          {' '}and{' '}
          <Text
            onPress={() => setLegalModal('privacy')}
            style={{ textDecorationLine: 'underline' }}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>

      <Modal
        visible={legalModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLegalModal(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
          <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
            <View
              style={{
                width: 36,
                height: 5,
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.15)',
                marginBottom: 12,
              }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 24 }}>
              <View style={{ width: 40 }} />
              <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#1C1C1E' }}>
                {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
              </Text>
              <CircleIconButton icon="close" onPress={() => setLegalModal(null)} />
            </View>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {legalModal === 'privacy' ? <PrivacyPolicyContent /> : <TermsOfUseContent />}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function LegalSectionTitle({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginTop: 24, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function LegalParagraph({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 14, lineHeight: 22, color: '#8E8E93', marginBottom: 12 }}>
      {children}
    </Text>
  );
}

function PrivacyPolicyContent() {
  return (
    <View>
      <Text style={{ fontSize: 12, color: '#AEAEB2', marginTop: 8, marginBottom: 16 }}>
        Last updated: August 2026
      </Text>

      <LegalParagraph>
        Radiance ("we", "us", or "our") respects your privacy and is committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, and safeguard your information when you use the Radiance mobile application.
      </LegalParagraph>

      <LegalSectionTitle>1. Information We Collect</LegalSectionTitle>
      <LegalParagraph>
        Account information: When you create an account, we collect your name, email address, and authentication credentials via our authentication provider (Clerk).
      </LegalParagraph>
      <LegalParagraph>
        Skin data: We collect the information you provide through our skin quiz (skin type, concerns, sensitivities) and, if you opt in, facial photos for skin analysis. Photos are processed to generate your skin score and metrics, then stored securely.
      </LegalParagraph>
      <LegalParagraph>
        Usage data: We collect information about how you interact with the app, including routine completions, mood logs, and skin log entries, to personalize your experience and track your progress.
      </LegalParagraph>

      <LegalSectionTitle>2. How We Use Your Information</LegalSectionTitle>
      <LegalParagraph>
        We use your information to provide personalized skin analysis and routine recommendations, track your skin health progress over time, send you reminders and notifications (with your permission), improve our AI-powered analysis and recommendations, and process subscriptions and purchases.
      </LegalParagraph>

      <LegalSectionTitle>3. Photo Storage & Processing</LegalSectionTitle>
      <LegalParagraph>
        Facial photos you capture are uploaded securely to our cloud storage provider (Cloudinary) and processed by our skin analysis service. Photos are used solely for your skin analysis and are never shared with other users or third parties for marketing purposes.
      </LegalParagraph>

      <LegalSectionTitle>4. Third-Party Services</LegalSectionTitle>
      <LegalParagraph>
        We use the following third-party services: Clerk for authentication, Cloudinary for secure photo storage, OpenAI for AI-powered skin analysis, RevenueCat for subscription management, and Expo for push notifications. Each service processes data in accordance with their own privacy policies.
      </LegalParagraph>

      <LegalSectionTitle>5. Data Retention & Deletion</LegalSectionTitle>
      <LegalParagraph>
        You can delete your account and all associated data at any time from the Profile screen. When you delete your account, all your personal data, skin profiles, photos, logs, and routines are permanently removed from our systems.
      </LegalParagraph>

      <LegalSectionTitle>6. Security</LegalSectionTitle>
      <LegalParagraph>
        We implement industry-standard security measures including encrypted data transmission (TLS), secure token-based authentication, and access controls to protect your personal information.
      </LegalParagraph>

      <LegalSectionTitle>7. Contact Us</LegalSectionTitle>
      <LegalParagraph>
        If you have any questions about this Privacy Policy, please contact us through the Contact Us section in the app.
      </LegalParagraph>
    </View>
  );
}

function TermsOfUseContent() {
  return (
    <View>
      <Text style={{ fontSize: 12, color: '#AEAEB2', marginTop: 8, marginBottom: 16 }}>
        Last updated: August 2026
      </Text>

      <LegalParagraph>
        Welcome to Radiance. By using our mobile application, you agree to be bound by these Terms of Use. Please read them carefully before using the app.
      </LegalParagraph>

      <LegalSectionTitle>1. Acceptance of Terms</LegalSectionTitle>
      <LegalParagraph>
        By accessing or using Radiance, you agree to these Terms of Use and our Privacy Policy. If you do not agree, please do not use the app.
      </LegalParagraph>

      <LegalSectionTitle>2. Description of Service</LegalSectionTitle>
      <LegalParagraph>
        Radiance is an AI-powered skincare application that provides personalized skin analysis, routine recommendations, and progress tracking. Our analysis is for informational purposes only and does not constitute medical advice.
      </LegalParagraph>

      <LegalSectionTitle>3. Not Medical Advice</LegalSectionTitle>
      <LegalParagraph>
        Radiance is not a medical device and does not provide medical diagnoses or treatment recommendations. The skin analysis, scores, and routine suggestions are generated by AI and should not replace professional dermatological advice. Always consult a qualified healthcare provider for skin conditions or concerns.
      </LegalParagraph>

      <LegalSectionTitle>4. Accounts</LegalSectionTitle>
      <LegalParagraph>
        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when creating your account and keep it up to date.
      </LegalParagraph>

      <LegalSectionTitle>5. Subscriptions & Purchases</LegalSectionTitle>
      <LegalParagraph>
        Some features require a Radiance Pro subscription. Subscriptions are billed through the Apple App Store or Google Play Store and are subject to their respective terms. Subscriptions auto-renew unless canceled at least 24 hours before the end of the current billing period. You can manage and cancel subscriptions in your device settings.
      </LegalParagraph>

      <LegalSectionTitle>6. User Content</LegalSectionTitle>
      <LegalParagraph>
        You retain ownership of the photos and data you submit to Radiance. By uploading content, you grant us a limited license to process and store it for the purpose of providing our services to you.
      </LegalParagraph>

      <LegalSectionTitle>7. Prohibited Uses</LegalSectionTitle>
      <LegalParagraph>
        You agree not to use Radiance to violate any laws, upload harmful or inappropriate content, attempt to gain unauthorized access to our systems, or use the app in any way that could damage or impair its functionality.
      </LegalParagraph>

      <LegalSectionTitle>8. Limitation of Liability</LegalSectionTitle>
      <LegalParagraph>
        Radiance is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the app, including but not limited to skin reactions from following routine recommendations. Use the app at your own discretion.
      </LegalParagraph>

      <LegalSectionTitle>9. Changes to Terms</LegalSectionTitle>
      <LegalParagraph>
        We may update these Terms of Use from time to time. Continued use of the app after changes constitutes acceptance of the updated terms.
      </LegalParagraph>

      <LegalSectionTitle>10. Contact Us</LegalSectionTitle>
      <LegalParagraph>
        If you have any questions about these Terms, please contact us through the Contact Us section in the app.
      </LegalParagraph>
    </View>
  );
}
