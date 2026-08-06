/**
 * The Privacy Policy / Terms of Use sheet.
 *
 * Single source of truth for the legal copy — it used to be duplicated verbatim
 * in `(screens)/auth.tsx` and `(tabs)/profile.tsx`, and the paywall's footer
 * links had no handler at all. Anywhere that needs it renders this and owns the
 * `LegalDoc | null` state.
 */
import React from 'react';
import { View, Text, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CircleIconButton from '../ui/CircleIconButton';
import { COLORS } from '../../constants/theme';

export type LegalDoc = 'privacy' | 'terms';

const LAST_UPDATED = 'Last updated: August 2026';

export default function LegalModal({
  doc,
  onClose,
}: {
  /** Which document to show; `null` keeps the sheet closed. */
  doc: LegalDoc | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={doc !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              paddingHorizontal: 24,
            }}
          >
            <View style={{ width: 40 }} />
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 17,
                fontWeight: '600',
                color: COLORS.text,
              }}
            >
              {doc === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
            </Text>
            <CircleIconButton icon="close" onPress={onClose} />
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {doc === 'privacy' ? <PrivacyPolicyContent /> : <TermsOfUseContent />}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 24,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.textSecondary,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function LastUpdated() {
  return (
    <Text style={{ fontSize: 12, color: COLORS.textTertiary, marginTop: 8, marginBottom: 16 }}>
      {LAST_UPDATED}
    </Text>
  );
}

export function PrivacyPolicyContent() {
  return (
    <View>
      <LastUpdated />

      <Paragraph>
        Radiance (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is
        committed to protecting the personal data you share with us. This Privacy Policy explains
        how we collect, use, and safeguard your information when you use the Radiance mobile
        application.
      </Paragraph>

      <SectionTitle>1. Information We Collect</SectionTitle>
      <Paragraph>
        Account information: When you create an account, we collect your name, email address, and
        authentication credentials via our authentication provider (Clerk).
      </Paragraph>
      <Paragraph>
        Skin data: We collect the information you provide through our skin quiz (skin type,
        concerns, sensitivities) and, if you opt in, facial photos for skin analysis. Photos are
        processed to generate your skin score and metrics, then stored securely.
      </Paragraph>
      <Paragraph>
        Usage data: We collect information about how you interact with the app, including routine
        completions, mood logs, and skin log entries, to personalize your experience and track your
        progress.
      </Paragraph>

      <SectionTitle>2. How We Use Your Information</SectionTitle>
      <Paragraph>
        We use your information to provide personalized skin analysis and routine recommendations,
        track your skin health progress over time, send you reminders and notifications (with your
        permission), improve our AI-powered analysis and recommendations, and process subscriptions
        and purchases.
      </Paragraph>

      <SectionTitle>3. Photo Storage &amp; Processing</SectionTitle>
      <Paragraph>
        Facial photos you capture are uploaded securely to our cloud storage provider (Cloudinary)
        and processed by our skin analysis service. Photos are used solely for your skin analysis
        and are never shared with other users or third parties for marketing purposes.
      </Paragraph>

      <SectionTitle>4. Third-Party Services</SectionTitle>
      <Paragraph>
        We use the following third-party services: Clerk for authentication, Cloudinary for secure
        photo storage, OpenAI for AI-powered skin analysis, RevenueCat for subscription management,
        and Expo for push notifications. Each service processes data in accordance with their own
        privacy policies.
      </Paragraph>

      <SectionTitle>5. Data Retention &amp; Deletion</SectionTitle>
      <Paragraph>
        You can delete your account and all associated data at any time from the Profile screen.
        When you delete your account, all your personal data, skin profiles, photos, logs, and
        routines are permanently removed from our systems.
      </Paragraph>

      <SectionTitle>6. Security</SectionTitle>
      <Paragraph>
        We implement industry-standard security measures including encrypted data transmission
        (TLS), secure token-based authentication, and access controls to protect your personal
        information.
      </Paragraph>

      <SectionTitle>7. Contact Us</SectionTitle>
      <Paragraph>
        If you have any questions about this Privacy Policy, please contact us through the Contact
        Us section in the app.
      </Paragraph>
    </View>
  );
}

export function TermsOfUseContent() {
  return (
    <View>
      <LastUpdated />

      <Paragraph>
        Welcome to Radiance. By using our mobile application, you agree to be bound by these Terms
        of Use. Please read them carefully before using the app.
      </Paragraph>

      <SectionTitle>1. Acceptance of Terms</SectionTitle>
      <Paragraph>
        By accessing or using Radiance, you agree to these Terms of Use and our Privacy Policy. If
        you do not agree, please do not use the app.
      </Paragraph>

      <SectionTitle>2. Description of Service</SectionTitle>
      <Paragraph>
        Radiance is an AI-powered skincare application that provides personalized skin analysis,
        routine recommendations, and progress tracking. Our analysis is for informational purposes
        only and does not constitute medical advice.
      </Paragraph>

      <SectionTitle>3. Not Medical Advice</SectionTitle>
      <Paragraph>
        Radiance is not a medical device and does not provide medical diagnoses or treatment
        recommendations. The skin analysis, scores, and routine suggestions are generated by AI and
        should not replace professional dermatological advice. Always consult a qualified healthcare
        provider for skin conditions or concerns.
      </Paragraph>

      <SectionTitle>4. Accounts</SectionTitle>
      <Paragraph>
        You are responsible for maintaining the confidentiality of your account credentials and for
        all activities that occur under your account. You must provide accurate information when
        creating your account and keep it up to date.
      </Paragraph>

      <SectionTitle>5. Subscriptions &amp; Purchases</SectionTitle>
      <Paragraph>
        Some features require a Radiance Pro subscription. Subscriptions are billed through the
        Apple App Store or Google Play Store and are subject to their respective terms.
        Subscriptions auto-renew unless canceled at least 24 hours before the end of the current
        billing period. You can manage and cancel subscriptions in your device settings.
      </Paragraph>

      <SectionTitle>6. User Content</SectionTitle>
      <Paragraph>
        You retain ownership of the photos and data you submit to Radiance. By uploading content,
        you grant us a limited license to process and store it for the purpose of providing our
        services to you.
      </Paragraph>

      <SectionTitle>7. Prohibited Uses</SectionTitle>
      <Paragraph>
        You agree not to use Radiance to violate any laws, upload harmful or inappropriate content,
        attempt to gain unauthorized access to our systems, or use the app in any way that could
        damage or impair its functionality.
      </Paragraph>

      <SectionTitle>8. Limitation of Liability</SectionTitle>
      <Paragraph>
        Radiance is provided &quot;as is&quot; without warranties of any kind. We are not liable for
        any damages arising from your use of the app, including but not limited to skin reactions
        from following routine recommendations. Use the app at your own discretion.
      </Paragraph>

      <SectionTitle>9. Changes to Terms</SectionTitle>
      <Paragraph>
        We may update these Terms of Use from time to time. Continued use of the app after changes
        constitutes acceptance of the updated terms.
      </Paragraph>

      <SectionTitle>10. Contact Us</SectionTitle>
      <Paragraph>
        If you have any questions about these Terms, please contact us through the Contact Us
        section in the app.
      </Paragraph>
    </View>
  );
}
