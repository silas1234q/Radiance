/**
 * Help centre content.
 *
 * Ported from the app's `(screens)/faq.tsx`. Two answers were corrected on the
 * way over — see the notes inline. Keep the app copy in sync.
 */

export type FaqEntry = {
  question: string
  answer: string
}

export type FaqGroup = {
  heading: string
  entries: FaqEntry[]
}

export const faqGroups: FaqGroup[] = [
  {
    heading: 'Analysis & scanning',
    entries: [
      {
        question: 'How does the skin analysis work?',
        answer:
          'Our AI analyses your quiz answers — and optionally a face scan photo — to evaluate your skin across metrics including hydration, oil balance, barrier strength, pigmentation and acne. The results produce a personalised skin score and tailored routines.',
      },
      {
        question: 'How does the face scan work?',
        answer:
          'The face scan uses your front camera to capture a photo. Before it is used, the photo is checked on your device for framing, distance, head angle and open eyes. If it passes, it is analysed alongside your quiz answers for a more detailed assessment.',
      },
      {
        question: 'Can I use the app without a face scan?',
        answer:
          'Yes. The face scan is optional. The skin quiz alone produces your analysis and personalised routines — the scan simply adds extra detail.',
      },
      {
        question: 'What is the skin score?',
        answer:
          'Your skin score is a 0–100 rating reflecting overall skin health across metrics like hydration, texture, barrier strength and pigmentation. Track it over time on the Progress tab to see improvements.',
      },
    ],
  },
  {
    heading: 'Routines',
    entries: [
      {
        question: 'How are my AM/PM routines created?',
        answer:
          'Routines are generated from your skin profile, concerns and goals. Morning routines focus on protection, evening routines on repair, and each step carries the reasoning behind it.',
      },
      {
        question: 'Can I customise my routine?',
        answer:
          "Yes. You can add, remove or reorder steps. Open the Routine tab and tap 'Edit' to make changes, or adjust Routine Preferences in your profile to set budget and ingredients to avoid.",
      },
      {
        question: 'How do I change my skin profile?',
        answer:
          'Go to Profile → My Skin Profile. You can update your skin type, concerns, sensitivity level and other details, and your routines will refresh based on the update.',
      },
    ],
  },
  {
    heading: 'Tracking & progress',
    entries: [
      {
        question: 'How do I log my daily skin condition?',
        answer:
          "Tap the '+' button on the Dashboard to open the skin log. You can record lifestyle factors like sleep, water intake, stress and sun exposure, plus optional notes and photos.",
      },
      {
        question: 'What are streaks and XP?',
        answer:
          'Completing your AM and PM routines earns XP and builds your streak. Consistency is what actually changes skin, so milestone streaks earn bonus XP — and a limited streak restore means one missed day need not undo a month.',
      },
    ],
  },
  {
    heading: 'Privacy & account',
    entries: [
      {
        // Corrected from the app copy, which said data is "never shared with
        // third parties" — inaccurate, since Clerk, Cloudinary, OpenAI, PostHog
        // and RevenueCat all process data as sub-processors.
        question: 'Is my data private and secure?',
        answer:
          'Your photos and personal data are transmitted over encrypted connections and stored securely. We do not sell your data and we never share it with other users or for marketing. We do rely on a small number of service providers to run the app — authentication, photo storage, AI analysis, subscriptions and analytics — each covered in our Privacy Policy. You can delete your account and all associated data at any time from your profile.',
      },
      {
        question: 'How do I delete my account?',
        answer:
          'Go to Profile → App Settings and choose to delete your account. This permanently removes your personal data, skin profiles, photos, logs and routines from our systems.',
      },
      {
        question: 'Does Radiance replace seeing a dermatologist?',
        answer:
          'No. Radiance is a skincare and wellness app. It does not diagnose or treat any condition and is not a substitute for professional care. If something on your skin is painful, changing quickly or worrying you, please see a qualified healthcare provider.',
      },
    ],
  },
]
