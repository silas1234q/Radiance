/**
 * Pricing page content.
 *
 * These figures mirror the in-app paywall exactly (yearly US$59.99, monthly
 * US$5.99, weekly US$1.99). If the RevenueCat products change, change them here
 * in the same commit — a public page that disagrees with what the paywall
 * charges is both an App Review problem and a consumer-law one.
 *
 * Note: no free trial is advertised anywhere here, because the paywall does not
 * offer one. If a trial is added to the RevenueCat offering, reinstate it in
 * `plans[].cta` and in `pricingFaq`.
 */

export type PricingPlan = {
  name: string
  /** Major + minor units, no symbol — the page renders the symbol. */
  price: string
  cadence: string
  /** Normalised comparison, so the tiers can be judged against each other. */
  equivalent: string
  /** Small badge in the card header. Empty string hides it. */
  badge: string
  description: string
  features: string[]
  featured: boolean
}

export const CURRENCY = 'US$'

export const plans: PricingPlan[] = [
  {
    name: 'Weekly',
    price: '1.99',
    cadence: 'per week',
    equivalent: 'about US$8.62 / month',
    badge: '',
    description: 'Try Premium for a week at a time, with no longer commitment.',
    features: [
      'Full AI skin analysis',
      'Unlimited face scans',
      'Side-by-side progress comparisons',
      'Product fit scores and ingredient flags',
      'Cancel any time',
    ],
    featured: false,
  },
  {
    name: 'Monthly',
    price: '5.99',
    cadence: 'per month',
    equivalent: 'US$5.99 / month',
    badge: '',
    description: 'The usual choice. Everything in Premium, billed month to month.',
    features: [
      'Full AI skin analysis',
      'Unlimited face scans',
      'Side-by-side progress comparisons',
      'Product fit scores and ingredient flags',
      'Weekly skincare plan',
    ],
    featured: false,
  },
  {
    name: 'Yearly',
    price: '59.99',
    cadence: 'per year',
    equivalent: 'US$5.00 / month',
    badge: 'Save 17%',
    description: 'The best rate, and the timeframe over which skin actually changes.',
    features: [
      'Everything in Monthly',
      'Billed once a year',
      'Works out at US$5.00 a month',
    ],
    featured: true,
  },
]

/** The no-payment path, shown separately from the paid tiers. */
export const freeTier = {
  name: 'Start free',
  description:
    'You do not need to pay to use Radiance. Complete the skin quiz and get a free estimate of where your skin stands, plus a starter routine, daily logging and streaks — with no time limit.',
  features: [
    'Full skin quiz',
    'Free skin estimate',
    'Starter AM and PM routine',
    'Daily skin and mood logging',
    'Streaks and XP',
  ],
}

export const pricingFaq = [
  {
    question: 'Can I use Radiance without paying?',
    answer:
      'Yes. The skin quiz, your free estimate, a starter routine, daily logging and streaks are all free, with no time limit. Premium adds the full AI analysis, unlimited scans and progress comparisons.',
  },
  {
    question: 'How do I cancel?',
    answer:
      'Subscriptions are billed through the App Store, so you cancel in your Apple ID subscription settings. Cancelling at least 24 hours before the end of a period stops the next renewal.',
  },
  {
    question: 'Which plan is the best value?',
    answer:
      'Yearly, by some distance. It works out at US$5.00 a month against US$5.99 monthly and about US$8.62 a month if you pay weekly. Skin also changes over months rather than weeks, so the longer plan matches the timescale the app works on.',
  },
  {
    question: 'What happens to my data if I stop paying?',
    answer:
      'Your account, history and logs stay put. You keep the free features and lose access to the Premium ones until you resubscribe.',
  },
  {
    question: 'Do prices differ by country?',
    answer:
      'Yes. The prices shown here are in US dollars. The App Store converts to your local currency and may adjust for local pricing and tax, so check the price shown in the app before subscribing.',
  },
]
