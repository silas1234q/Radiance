/**
 * Legal copy for the public site.
 *
 * Ported from the app's `frontend/src/components/legal/LegalModal.tsx`, which
 * renders the same documents in-app. Keep the two in sync when either changes —
 * App Store review compares the hosted policy against what the app shows.
 */

export const SUPPORT_EMAIL = 'sarfosilas2003@gmail.com'

export const LAST_UPDATED = 'August 2026'

export type LegalSection = {
  title: string
  body: string[]
}

export type LegalDocument = {
  slug: string
  title: string
  /** Sits under the page title, and used as the meta description. */
  summary: string
  intro: string[]
  sections: LegalSection[]
}

export const privacyPolicy: LegalDocument = {
  slug: 'privacy',
  title: 'Privacy Policy',
  summary: 'How Radiance collects, uses, and safeguards your personal data.',
  intro: [
    'Radiance ("we", "us", or "our") respects your privacy and is committed to protecting the personal data you share with us. This Privacy Policy explains how we collect, use, and safeguard your information when you use the Radiance mobile application and this website.',
  ],
  sections: [
    {
      title: 'Information We Collect',
      body: [
        'Account information: When you create an account, we collect your name, email address, and authentication credentials via our authentication provider (Clerk).',
        'Skin data: We collect the information you provide through our skin quiz (skin type, concerns, sensitivities) and, if you opt in, facial photos for skin analysis. Photos are processed to generate your skin score and metrics, then stored securely.',
        'Usage data: We collect information about how you interact with the app, including routine completions, mood logs, and skin log entries, to personalise your experience and track your progress.',
      ],
    },
    {
      title: 'How We Use Your Information',
      body: [
        'We use your information to provide personalised skin analysis and routine recommendations, track your skin health progress over time, send you reminders and notifications (with your permission), improve our AI-powered analysis and recommendations, and process subscriptions and purchases.',
      ],
    },
    {
      title: 'Photo Storage & Processing',
      body: [
        'Facial photos you capture are uploaded securely to our cloud storage provider (Cloudinary) and processed by our skin analysis service. Photos are used solely for your skin analysis and are never shared with other users or third parties for marketing purposes.',
      ],
    },
    {
      title: 'Third-Party Services',
      body: [
        'We use the following third-party services: Clerk for authentication, Cloudinary for secure photo storage, OpenAI for AI-powered skin analysis, RevenueCat for subscription management, Expo for push notifications, and PostHog for product analytics. Each service processes data in accordance with their own privacy policies.',
        'Product information shown in the app is sourced in part from Open Beauty Facts, an open database of cosmetic products. We do not share your personal data with Open Beauty Facts.',
      ],
    },
    {
      title: 'Analytics & This Website',
      body: [
        'We use PostHog to understand how the app and this website are used, so we can improve them. This includes pages and screens viewed and features used. In the app, analytics events are associated with your account identifier only — never your email address or your photos.',
        'We do not sell your personal data, and we do not use your data for cross-app or cross-site advertising tracking.',
      ],
    },
    {
      title: 'Data Retention & Deletion',
      body: [
        'You can delete your account and all associated data at any time from the Profile screen in the app. When you delete your account, all your personal data, skin profiles, photos, logs, and routines are permanently removed from our systems.',
      ],
    },
    {
      title: 'Security',
      body: [
        'We implement industry-standard security measures including encrypted data transmission (TLS), secure token-based authentication, and access controls to protect your personal information.',
      ],
    },
    {
      title: "Children's Privacy",
      body: [
        'Radiance is not intended for children under 13, and we do not knowingly collect personal data from them. If you believe a child has provided us with personal data, contact us at ' +
          SUPPORT_EMAIL +
          ' and we will delete it.',
      ],
    },
    {
      title: 'Contact Us',
      body: [
        'If you have any questions about this Privacy Policy, or would like to request access to or deletion of your data, contact us at ' +
          SUPPORT_EMAIL +
          '.',
      ],
    },
  ],
}

export const termsOfUse: LegalDocument = {
  slug: 'terms',
  title: 'Terms of Use',
  summary: 'The terms you agree to when using Radiance.',
  intro: [
    'Welcome to Radiance. By using our mobile application, you agree to be bound by these Terms of Use. Please read them carefully before using the app.',
  ],
  sections: [
    {
      title: 'Acceptance of Terms',
      body: [
        'By accessing or using Radiance, you agree to these Terms of Use and our Privacy Policy. If you do not agree, please do not use the app.',
      ],
    },
    {
      title: 'Description of Service',
      body: [
        'Radiance is an AI-powered skincare application that provides personalised skin analysis, routine recommendations, and progress tracking. Our analysis is for informational purposes only and does not constitute medical advice.',
      ],
    },
    {
      title: 'Not Medical Advice',
      body: [
        'Radiance is not a medical device and does not provide medical diagnoses or treatment recommendations. The skin analysis, scores, and routine suggestions are generated by AI and should not replace professional dermatological advice. Always consult a qualified healthcare provider for skin conditions or concerns.',
      ],
    },
    {
      title: 'Accounts',
      body: [
        'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when creating your account and keep it up to date.',
      ],
    },
    {
      title: 'Subscriptions & Purchases',
      body: [
        'Some features require a Radiance subscription. Subscriptions are billed through the Apple App Store or Google Play Store and are subject to their respective terms. Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current billing period. You can manage and cancel subscriptions in your device settings.',
      ],
    },
    {
      title: 'User Content',
      body: [
        'You retain ownership of the photos and data you submit to Radiance. By uploading content, you grant us a limited licence to process and store it for the purpose of providing our services to you.',
      ],
    },
    {
      title: 'Prohibited Uses',
      body: [
        'You agree not to use Radiance to violate any laws, upload harmful or inappropriate content, attempt to gain unauthorised access to our systems, or use the app in any way that could damage or impair its functionality.',
      ],
    },
    {
      title: 'Limitation of Liability',
      body: [
        'Radiance is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the app, including but not limited to skin reactions from following routine recommendations. Use the app at your own discretion.',
      ],
    },
    {
      title: 'Changes to Terms',
      body: [
        'We may update these Terms of Use from time to time. Continued use of the app after changes constitutes acceptance of the updated terms.',
      ],
    },
    {
      title: 'Contact Us',
      body: [
        'If you have any questions about these Terms, contact us at ' + SUPPORT_EMAIL + '.',
      ],
    },
  ],
}
