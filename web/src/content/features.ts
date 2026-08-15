/**
 * Copy for the three product pages linked from the footer.
 *
 * Everything here describes behaviour that actually ships — the scan flow in
 * `(onboarding)/face-scan.tsx`, routine generation in `routineService.ts`, and
 * product fit scoring in `productAnalysisService.ts`. Keep it that way: these
 * pages are marketing, but App Review reads them alongside the app.
 */

export type FeatureHighlight = {
  title: string
  body: string
}

export type FeatureSection = {
  title: string
  body: string[]
}

export type FeaturePage = {
  slug: string
  eyebrow: string
  title: string
  summary: string
  highlights: FeatureHighlight[]
  sections: FeatureSection[]
}

export const faceScan: FeaturePage = {
  slug: 'face-scan',
  eyebrow: 'Face scan',
  title: 'A scan that actually checks itself',
  summary:
    'Most skin photos are unusable — too dark, too close, eyes half shut. Radiance validates the shot on your device before it counts, so your analysis is built on something worth analysing.',
  highlights: [
    {
      title: 'Guided framing',
      body: 'An on-screen guide shows you exactly where your face should sit. No guessing how far to hold the phone.',
    },
    {
      title: 'Validated on capture',
      body: 'Face position, distance, head angle and open eyes are all checked the moment you take the shot.',
    },
    {
      title: 'Screen flash',
      body: 'The front camera has no flash, so the screen briefly brightens to give you usable light in a dim bathroom.',
    },
    {
      title: 'Entirely optional',
      body: 'The quiz alone produces a full analysis. The scan adds detail — it is never a requirement.',
    },
  ],
  sections: [
    {
      title: 'Why the validation matters',
      body: [
        'A skin analysis is only as good as the photo behind it. A shot taken at arm’s length in yellow light tells you about the light, not your skin.',
        'So before a photo is ever used, Radiance runs it through on-device face detection and checks a handful of things: that there is exactly one face, that it fills a sensible share of the frame, that it is roughly centred, that your head is not turned too far, and that your eyes are open. If any check fails you get a plain-language reason and another go.',
      ],
    },
    {
      title: 'What happens to your photo',
      body: [
        'Validation runs on your device. If the photo passes and you choose to unlock your analysis, it is uploaded securely and analysed to produce your skin metrics and your before-and-now comparisons.',
        'Your photos are never shown to other users and never used for marketing. You can delete your account and everything in it at any time from your profile.',
      ],
    },
    {
      title: 'Scan as often as you like',
      body: [
        'Skin changes slowly, so there is little value in scanning daily. Most people rescan every week or two — often enough to see the line move, rarely enough that the change is real rather than lighting.',
        'Every scan you keep becomes part of your progress timeline, which is where the side-by-side comparisons come from.',
      ],
    },
  ],
}

export const routines: FeaturePage = {
  slug: 'routines',
  eyebrow: 'Routines',
  title: 'A morning and night routine you will actually finish',
  summary:
    'Built from your quiz answers, your concerns and your goals — with a reason attached to every step, so you know why it is there and what it is doing.',
  highlights: [
    {
      title: 'Built around your profile',
      body: 'Skin type, sensitivities, concerns and goals all feed the routine you get. Not a generic template.',
    },
    {
      title: 'Every step explained',
      body: 'Each step carries the reasoning behind it, so the routine teaches you something instead of just issuing orders.',
    },
    {
      title: 'Yours to edit',
      body: 'Add, remove and reorder steps. Set preferences like budget and ingredients to avoid, and the routine adapts.',
    },
    {
      title: 'Streaks that mean something',
      body: 'Completing AM and PM earns XP and builds a streak, because consistency is the part that actually changes skin.',
    },
  ],
  sections: [
    {
      title: 'Morning protects, evening repairs',
      body: [
        'The two halves of your day do different jobs. Mornings are about protection — cleansing, hydration and sun protection to hold the line against the day ahead. Evenings are about repair, which is when actives and treatments do their work.',
        'Radiance builds both, and keeps the step count honest. A routine you abandon in a week is worse than a short one you keep.',
      ],
    },
    {
      title: 'Change it whenever you like',
      body: [
        'Your routine is a starting point, not a prescription. Reorder steps, drop the ones that do not suit you, and add products you already own from your shelf.',
        'Routine preferences let you set a budget tier and flag ingredients you react to, and future recommendations respect both.',
      ],
    },
    {
      title: 'Consistency is the whole game',
      body: [
        'Almost every skincare result depends on doing the same reasonable thing for weeks. That is unglamorous, and it is why most routines fail.',
        'So Radiance tracks completion rather than perfection: a weekly consistency view, morning and evening streaks, and gentle reminders you can switch off entirely. Miss a day and there is a limited streak restore, because one bad night should not undo a month.',
      ],
    },
  ],
}

export const productScanner: FeaturePage = {
  slug: 'product-scanner',
  eyebrow: 'Product scanner',
  title: 'Find out whether that product suits your skin',
  summary:
    'Search a product, add it to your shelf, and see how it fits your skin profile — a fit score, the ingredients worth knowing about, and honest pros and cons.',
  highlights: [
    {
      title: 'Fit score',
      body: 'Every product is scored against your specific profile, not against a generic idea of good skincare.',
    },
    {
      title: 'Ingredient flags',
      body: 'Alcohol-free, fragrance-free, fungal-acne-safe and more, surfaced from the actual ingredient list.',
    },
    {
      title: 'Honest pros and cons',
      body: 'Including the cons. A product that suits oily skin can be exactly wrong for dry or sensitive skin.',
    },
    {
      title: 'Your shelf in one place',
      body: 'Everything you own, recommended or added, kept together and usable in your routine steps.',
    },
  ],
  sections: [
    {
      title: 'Ingredients, read against your skin',
      body: [
        'The same ingredient is good news or bad news depending on whose face it is going on. Denatured alcohol gives a pleasant light finish on oily skin and strips a dry or sensitive barrier. Sodium lauryl sulfate cleans well and is a poor idea if you are prone to eczema.',
        'Radiance reads the ingredient list against your profile and tells you which way it falls for you, with the reasoning attached.',
      ],
    },
    {
      title: 'Where the product data comes from',
      body: [
        'Product information is sourced in part from Open Beauty Facts, an open, community-maintained database of cosmetic products. You can also add anything manually if a product is not listed.',
        'Because the data is community-contributed, ingredient lists can occasionally be incomplete or out of date. Always check the packaging if you have a known allergy.',
      ],
    },
    {
      title: 'Build a shelf, then build routines from it',
      body: [
        'Products you scan, add or get recommended all land on your shelf. From there they can be dropped straight into routine steps, so your routine reflects what is actually in your bathroom.',
        'If a product is a poor fit for the step you put it in, Radiance will say so rather than quietly going along with it.',
      ],
    },
  ],
}

export const featurePages = [faceScan, routines, productScanner]
