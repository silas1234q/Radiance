/**
 * The Privacy Policy / Terms of Use sheet.
 *
 * Single source of truth for the legal copy — it used to be duplicated verbatim
 * in `(screens)/auth.tsx` and `(tabs)/profile.tsx`, and the paywall's footer
 * links had no handler at all. Anywhere that needs it renders this and owns the
 * `LegalDoc | null` state.
 *
 * The same documents are published on the marketing site from
 * `web/src/content/legal.ts` — keep the two in sync when either changes, since
 * App Store review compares the hosted policy against what the app shows. The
 * Terms mirror Apple's standard EULA (Schedule 1 minimum terms), so sections
 * 10-18 must survive any rewrite.
 */
import React from 'react';
import { View, Text, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CircleIconButton from '../ui/CircleIconButton';
import { COLORS } from '../../constants/theme';

export type LegalDoc = 'privacy' | 'terms';

const LAST_UPDATED = 'Last updated: August 2026';

/** Also hardcoded in `(screens)/contact-us.tsx`. */
const SUPPORT_EMAIL = 'sarfosilas2003@gmail.com';

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
        Radiance  respects your privacy and is
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
        Expo for push notifications, and PostHog for product analytics. Each service processes data
        in accordance with their own privacy policies.
      </Paragraph>
      <Paragraph>
        Product information shown in the app is sourced in part from Open Beauty Facts, an open
        database of cosmetic products. We do not share your personal data with Open Beauty Facts.
      </Paragraph>

      <SectionTitle>5. Analytics</SectionTitle>
      <Paragraph>
        We use PostHog to understand how the app is used, so we can improve it. This includes
        screens viewed and features used. Analytics events are associated with your account
        identifier only — never your email address or your photos.
      </Paragraph>
      <Paragraph>
        We do not sell your personal data, and we do not use your data for cross-app or cross-site
        advertising tracking.
      </Paragraph>

      <SectionTitle>6. Data Retention &amp; Deletion</SectionTitle>
      <Paragraph>
        You can delete your account and all associated data at any time from the Profile screen.
        When you delete your account, all your personal data, skin profiles, photos, logs, and
        routines are permanently removed from our systems.
      </Paragraph>

      <SectionTitle>7. Security</SectionTitle>
      <Paragraph>
        We implement industry-standard security measures including encrypted data transmission
        (TLS), secure token-based authentication, and access controls to protect your personal
        information.
      </Paragraph>

      <SectionTitle>8. Children&apos;s Privacy</SectionTitle>
      <Paragraph>
        Radiance is not intended for children under 13, and we do not knowingly collect personal
        data from them. If you believe a child has provided us with personal data, contact us at{' '}
        {SUPPORT_EMAIL} and we will delete it.
      </Paragraph>

      <SectionTitle>9. Contact Us</SectionTitle>
      <Paragraph>
        If you have any questions about this Privacy Policy, or would like to request access to or
        deletion of your data, contact us through the Contact Us section in the app or at{' '}
        {SUPPORT_EMAIL}.
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
      <Paragraph>
        Radiance is licensed, not sold, to you. Sections 9 to 24 form the end user license agreement
        for the app and follow Apple&apos;s Licensed Application End User License Agreement. In
        them, &quot;Licensor&quot; means us, the Application Provider of Radiance. We reserve all
        rights in and to Radiance not expressly granted to you under these Terms.
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

      <SectionTitle>4. Eligibility</SectionTitle>
      <Paragraph>
        You must be at least 13 years old to use Radiance. If you are under the age of majority
        where you live, you may only use Radiance with the involvement of a parent or guardian who
        agrees to these Terms on your behalf.
      </Paragraph>

      <SectionTitle>5. Accounts</SectionTitle>
      <Paragraph>
        You are responsible for maintaining the confidentiality of your account credentials and for
        all activities that occur under your account. You must provide accurate information when
        creating your account and keep it up to date.
      </Paragraph>

      <SectionTitle>6. Subscriptions &amp; Purchases</SectionTitle>
      <Paragraph>
        Some features require a Radiance Pro subscription. Subscriptions are billed through the
        Apple App Store or Google Play Store and are subject to their respective terms.
        Subscriptions auto-renew unless canceled at least 24 hours before the end of the current
        billing period. You can manage and cancel subscriptions in your device settings.
      </Paragraph>
      <Paragraph>
        Payment is charged to your App Store or Google Play account at confirmation of purchase. Any
        unused portion of a free trial period is forfeited when you purchase a subscription. Refunds
        are handled by Apple or Google under their own policies — we are not able to issue refunds
        for store purchases directly.
      </Paragraph>

      <SectionTitle>7. User Content</SectionTitle>
      <Paragraph>
        You retain ownership of the photos and data you submit to Radiance. By uploading content,
        you grant us a limited license to process and store it for the purpose of providing our
        services to you.
      </Paragraph>

      <SectionTitle>8. Prohibited Uses</SectionTitle>
      <Paragraph>
        You agree not to use Radiance to violate any laws, upload harmful or inappropriate content,
        attempt to gain unauthorized access to our systems, or use the app in any way that could
        damage or impair its functionality.
      </Paragraph>

      <SectionTitle>9. Acknowledgement</SectionTitle>
      <Paragraph>
        You and we acknowledge that these Terms are concluded between you and us only, and not with
        Apple Inc. (&quot;Apple&quot;), and that we, not Apple, are solely responsible for Radiance
        and its content. These Terms do not provide for usage rules for Radiance that conflict with
        the Apple Media Services Terms and Conditions (&quot;Usage Rules&quot;).
      </Paragraph>
      <Paragraph>
        Where Radiance is obtained through Google Play, it is licensed to you subject to the Google
        Play Terms of Service, and Google is likewise not a party to these Terms.
      </Paragraph>

      <SectionTitle>10. Scope of License</SectionTitle>
      <Paragraph>
        Licensor grants to you a nontransferable license to use Radiance on any Apple-branded
        products that you own or control and as permitted by the Usage Rules. These Terms will
        govern any content, materials, or services accessible from or purchased within Radiance, as
        well as upgrades provided by Licensor that replace or supplement the original app, unless
        such upgrade is accompanied by a separate license agreement.
      </Paragraph>
      <Paragraph>
        Except as provided in the Usage Rules, you may not distribute or make Radiance available
        over a network where it could be used by multiple devices at the same time. You may not
        transfer, redistribute, or sublicense Radiance and, if you sell your Apple device to a third
        party, you must remove Radiance from the device before doing so.
      </Paragraph>
      <Paragraph>
        You may not copy (except as permitted by this license and the Usage Rules), reverse-engineer,
        disassemble, attempt to derive the source code of, modify, or create derivative works of
        Radiance, any updates, or any part thereof, except as and only to the extent that any of the
        foregoing restrictions is prohibited by applicable law, or to the extent permitted by the
        licensing terms governing use of any open-sourced components included with Radiance.
      </Paragraph>

      <SectionTitle>11. Consent to Use of Data</SectionTitle>
      <Paragraph>
        You agree that Licensor may collect and use technical data and related information —
        including but not limited to technical information about your device, system and application
        software, and peripherals — that is gathered periodically to facilitate the provision of
        software updates, product support, and other services to you (if any) related to Radiance.
        Licensor may use this information, as long as it is in a form that does not personally
        identify you, to improve its products or to provide services or technologies to you.
      </Paragraph>
      <Paragraph>
        Our handling of personal data, including your photos and skin data, is described separately
        in our Privacy Policy.
      </Paragraph>

      <SectionTitle>12. Termination</SectionTitle>
      <Paragraph>
        This license is effective until terminated by you or Licensor. Your rights under it will
        terminate automatically if you fail to comply with any of its terms.
      </Paragraph>
      <Paragraph>
        You may stop using Radiance and delete your account at any time from the Profile screen. We
        may suspend or terminate your access if you breach these Terms or use the app in a way that
        harms other users or our systems.
      </Paragraph>

      <SectionTitle>13. External Services</SectionTitle>
      <Paragraph>
        Radiance may enable access to Licensor&apos;s and/or third-party services and websites
        (collectively and individually, &quot;External Services&quot;). You agree to use the External
        Services at your sole risk. Licensor is not responsible for examining or evaluating the
        content or accuracy of any third-party External Services, and shall not be liable for any
        such third-party External Services.
      </Paragraph>
      <Paragraph>
        Data displayed by Radiance or any External Service, including but not limited to medical,
        health, and product information, is for general informational purposes only and is not
        guaranteed by Licensor or its agents. You will not use the External Services in any manner
        that is inconsistent with these Terms or that infringes the intellectual property rights of
        Licensor or any third party. You agree not to use the External Services to harass, abuse,
        stalk, threaten, or defame any person or entity, and that Licensor is not responsible for
        any such use.
      </Paragraph>
      <Paragraph>
        External Services may not be available in all languages or in your home country, and may not
        be appropriate or available for use in any particular location. To the extent you choose to
        use such External Services, you are solely responsible for compliance with any applicable
        laws. Licensor reserves the right to change, suspend, remove, disable, or impose access
        restrictions or limits on any External Services at any time without notice or liability to
        you.
      </Paragraph>

      <SectionTitle>14. No Warranty</SectionTitle>
      <Paragraph>
        YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT USE OF RADIANCE IS AT YOUR SOLE RISK. TO THE
        MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, RADIANCE AND ANY SERVICES PERFORMED OR PROVIDED
        BY IT ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;, WITH ALL FAULTS AND
        WITHOUT WARRANTY OF ANY KIND, AND LICENSOR HEREBY DISCLAIMS ALL WARRANTIES AND CONDITIONS
        WITH RESPECT TO RADIANCE AND ANY SERVICES, EITHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING,
        BUT NOT LIMITED TO, THE IMPLIED WARRANTIES AND/OR CONDITIONS OF MERCHANTABILITY, OF
        SATISFACTORY QUALITY, OF FITNESS FOR A PARTICULAR PURPOSE, OF ACCURACY, OF QUIET ENJOYMENT,
        AND OF NONINFRINGEMENT OF THIRD-PARTY RIGHTS.
      </Paragraph>
      <Paragraph>
        NO ORAL OR WRITTEN INFORMATION OR ADVICE GIVEN BY LICENSOR OR ITS AUTHORIZED REPRESENTATIVE
        SHALL CREATE A WARRANTY. SHOULD RADIANCE OR ITS SERVICES PROVE DEFECTIVE, YOU ASSUME THE
        ENTIRE COST OF ALL NECESSARY SERVICING, REPAIR, OR CORRECTION. SOME JURISDICTIONS DO NOT
        ALLOW THE EXCLUSION OF IMPLIED WARRANTIES OR LIMITATIONS ON APPLICABLE STATUTORY RIGHTS OF A
        CONSUMER, SO THE ABOVE EXCLUSION AND LIMITATIONS MAY NOT APPLY TO YOU.
      </Paragraph>

      <SectionTitle>15. Limitation of Liability</SectionTitle>
      <Paragraph>
        TO THE EXTENT NOT PROHIBITED BY LAW, IN NO EVENT SHALL LICENSOR BE LIABLE FOR PERSONAL
        INJURY OR ANY INCIDENTAL, SPECIAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER, INCLUDING,
        WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, OR ANY
        OTHER COMMERCIAL DAMAGES OR LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO
        USE RADIANCE, HOWEVER CAUSED, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, OR
        OTHERWISE) AND EVEN IF LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
      </Paragraph>
      <Paragraph>
        SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OF LIABILITY FOR PERSONAL INJURY, OR OF
        INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THIS LIMITATION MAY NOT APPLY TO YOU. In no event
        shall Licensor&apos;s total liability to you for all damages (other than as may be required
        by applicable law in cases involving personal injury) exceed the amount of fifty dollars
        ($50.00). The foregoing limitations will apply even if the above stated remedy fails of its
        essential purpose.
      </Paragraph>
      <Paragraph>
        This includes, without limitation, any skin reaction or other outcome arising from following
        routine or product recommendations generated by Radiance. Use the app at your own
        discretion.
      </Paragraph>

      <SectionTitle>16. Maintenance &amp; Support</SectionTitle>
      <Paragraph>
        We are solely responsible for providing any maintenance and support services for Radiance,
        as specified in these Terms or as required under applicable law. You and we acknowledge that
        Apple has no obligation whatsoever to furnish any maintenance and support services for
        Radiance. You can reach us through the Contact Us section in the app or at {SUPPORT_EMAIL}.
      </Paragraph>

      <SectionTitle>17. Warranty Failure &amp; Refunds</SectionTitle>
      <Paragraph>
        We are solely responsible for any product warranties, whether express or implied by law, to
        the extent they have not been effectively disclaimed. In the event of any failure of
        Radiance to conform to an applicable warranty, you may notify Apple, and Apple will refund
        the purchase price (if any) of the app to you.
      </Paragraph>
      <Paragraph>
        To the maximum extent permitted by applicable law, Apple will have no other warranty
        obligation whatsoever with respect to Radiance, and any other claims, losses, liabilities,
        damages, costs, or expenses attributable to any failure to conform to any warranty will be
        our sole responsibility.
      </Paragraph>

      <SectionTitle>18. Product Claims</SectionTitle>
      <Paragraph>
        We, not Apple, are responsible for addressing any claims by you or any third party relating
        to Radiance or your possession and use of it, including: (i) product liability claims; (ii)
        any claim that Radiance fails to conform to any applicable legal or regulatory requirement;
        and (iii) claims arising under consumer protection, privacy, or similar legislation,
        including in connection with Radiance&apos;s use of health-related data. Nothing in these
        Terms limits our liability to you beyond what is permitted by applicable law.
      </Paragraph>

      <SectionTitle>19. Intellectual Property Rights</SectionTitle>
      <Paragraph>
        In the event of any third party claim that Radiance, or your possession and use of it,
        infringes that third party&apos;s intellectual property rights, we, not Apple, will be
        solely responsible for the investigation, defense, settlement, and discharge of any such
        claim.
      </Paragraph>

      <SectionTitle>20. Export Compliance</SectionTitle>
      <Paragraph>
        You may not use or otherwise export or re-export Radiance except as authorized by United
        States law and the laws of the jurisdiction in which Radiance was obtained. In particular,
        but without limitation, Radiance may not be exported or re-exported (a) into any
        U.S.-embargoed countries or (b) to anyone on the U.S. Treasury Department&apos;s Specially
        Designated Nationals List or the U.S. Department of Commerce Denied Persons List or Entity
        List.
      </Paragraph>
      <Paragraph>
        By using Radiance, you represent and warrant that you are not located in any such country or
        on any such list, and that you are not located in a country that has been designated by the
        U.S. Government as a &quot;terrorist supporting&quot; country. You also agree that you will
        not use Radiance for any purposes prohibited by United States law, including, without
        limitation, the development, design, manufacture, or production of nuclear, missile, or
        chemical or biological weapons.
      </Paragraph>

      <SectionTitle>21. U.S. Government End Users</SectionTitle>
      <Paragraph>
        Radiance and related documentation are &quot;Commercial Items&quot;, as that term is defined
        at 48 C.F.R. §2.101, consisting of &quot;Commercial Computer Software&quot; and
        &quot;Commercial Computer Software Documentation&quot;, as such terms are used in 48 C.F.R.
        §12.212 or 48 C.F.R. §227.7202, as applicable. Consistent with 48 C.F.R. §12.212 or 48
        C.F.R. §227.7202-1 through 227.7202-4, as applicable, the Commercial Computer Software and
        Commercial Computer Software Documentation are being licensed to U.S. Government end users
        (a) only as Commercial Items and (b) with only those rights as are granted to all other end
        users pursuant to the terms and conditions herein. Unpublished-rights reserved under the
        copyright laws of the United States.
      </Paragraph>

      <SectionTitle>22. Governing Law</SectionTitle>
      <Paragraph>
        Except to the extent expressly provided in the following paragraph, these Terms and the
        relationship between you and Apple shall be governed by the laws of the State of California,
        excluding its conflicts of law provisions. You and Apple agree to submit to the personal and
        exclusive jurisdiction of the courts located within the county of Santa Clara, California,
        to resolve any dispute or claim arising from these Terms.
      </Paragraph>
      <Paragraph>
        If (a) you are not a U.S. citizen; (b) you do not reside in the U.S.; (c) you are not
        accessing the service from the U.S.; and (d) you are a citizen of any European Union
        country, or of Switzerland, Norway, or Iceland, then the governing law and forum shall be
        the laws and courts of your usual place of residence, without regard to any conflict of law
        provisions, and you hereby irrevocably submit to the non-exclusive jurisdiction of those
        courts.
      </Paragraph>
      <Paragraph>
        Specifically excluded from application to these Terms is the law known as the United Nations
        Convention on the International Sale of Goods.
      </Paragraph>

      <SectionTitle>23. Third Party Terms</SectionTitle>
      <Paragraph>
        You must comply with any applicable third party terms of agreement when using Radiance — for
        example, the terms of your wireless data provider, and the terms of the app store through
        which you obtained the app.
      </Paragraph>

      <SectionTitle>24. Third Party Beneficiary</SectionTitle>
      <Paragraph>
        You and we acknowledge and agree that Apple, and Apple&apos;s subsidiaries, are third party
        beneficiaries of these Terms, and that upon your acceptance of these Terms, Apple will have
        the right (and will be deemed to have accepted the right) to enforce these Terms against you
        as a third party beneficiary.
      </Paragraph>

      <SectionTitle>25. Changes to Terms</SectionTitle>
      <Paragraph>
        We may update these Terms of Use from time to time. Continued use of the app after changes
        constitutes acceptance of the updated terms.
      </Paragraph>

      <SectionTitle>26. Contact Us</SectionTitle>
      <Paragraph>
        Radiance is developed and provided by an independent individual developer. If you have any
        questions, complaints, or claims regarding Radiance or these Terms, contact us through the
        Contact Us section in the app or at {SUPPORT_EMAIL}, and we will respond as soon as we can.
      </Paragraph>
    </View>
  );
}
