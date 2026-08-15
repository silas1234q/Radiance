import { Link } from 'react-router'
import { CURRENCY, freeTier, plans, pricingFaq } from '../content/pricing'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/ui/Reveal'
import { usePageMeta } from '../lib/usePageMeta'

function Check({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`fill-none stroke-primary stroke-[2.5] ${className}`}
    >
      <path d="M4 10.5 8 14.5 16 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Pricing() {
  usePageMeta(
    'Pricing',
    'Radiance pricing — free to start, with Premium from US$5.00 a month billed yearly.',
  )

  return (
    <section className="relative px-6 pt-12 pb-24 md:pt-16">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Pricing"
          title="Free to start. Premium when it earns it."
          summary="The quiz, your free estimate and a starter routine cost nothing, with no time limit. Premium unlocks the full analysis and the whole progress picture."
        />

        {/* Paid tiers */}
        <div className="mt-14 grid items-start gap-4 md:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 80}>
              <div
                className={`flex h-full flex-col rounded-3xl border p-7 ${
                  plan.featured
                    ? 'border-primary/40 bg-card shadow-[0_24px_60px_-40px_rgb(240_102_128/0.7)]'
                    : 'border-hair bg-card'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.01em]">
                    {plan.name}
                  </h2>
                  {plan.badge && (
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-primary">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-[2.4rem] font-semibold leading-none tracking-[-0.03em]">
                    <span className="align-super text-[0.95rem] font-medium text-muted">
                      {CURRENCY}
                    </span>
                    {plan.price}
                  </span>
                  <span className="text-[0.82rem] text-faint">{plan.cadence}</span>
                </div>

                <p className="mt-1.5 text-[0.78rem] text-faint">{plan.equivalent}</p>

                <p className="mt-4 text-[0.9rem] leading-relaxed text-muted text-pretty">
                  {plan.description}
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-[0.88rem] text-muted">
                      <Check className="mt-[0.3rem] h-3 w-3 shrink-0" />
                      <span className="text-pretty">{feature}</span>
                    </li>
                  ))}
                </ul>

                <span
                  className={`mt-7 block rounded-full px-5 py-3 text-center text-[0.88rem] font-medium ${
                    plan.featured ? 'bg-ink text-white' : 'border border-hair text-ink'
                  }`}
                >
                  Get Radiance Pro
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-center text-[0.82rem] text-faint text-pretty">
          Subscriptions are billed through the App Store and renew automatically until cancelled.
          Prices shown in US dollars; your local price may differ. See our{' '}
          <Link to="/terms" className="text-muted underline underline-offset-2 hover:text-primary">
            Terms of Use
          </Link>{' '}
          for the full details.
        </p>

        {/* Free path */}
        <Reveal>
          <div className="mt-16 rounded-3xl border border-hair bg-card p-8 sm:p-10">
            <div className="grid gap-8 sm:grid-cols-[1.2fr_1fr] sm:items-center">
              <div>
                <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.02em] text-balance">
                  {freeTier.name}
                </h2>
                <p className="mt-3 text-[0.98rem] leading-[1.7] text-muted text-pretty">
                  {freeTier.description}
                </p>
              </div>
              <ul className="space-y-2.5">
                {freeTier.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-[0.9rem] text-muted">
                    <Check className="mt-[0.3rem] h-3 w-3 shrink-0" />
                    <span className="text-pretty">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Billing FAQ */}
        <div className="mx-auto mt-20 max-w-2xl border-t border-hair pt-14">
          <h2 className="text-center font-display text-[1.6rem] font-semibold tracking-[-0.02em]">
            Questions about billing
          </h2>
          <dl className="mt-8 space-y-4">
            {pricingFaq.map((item) => (
              <div key={item.question} className="rounded-2xl border border-hair bg-card p-6">
                <dt className="font-display text-[1rem] font-semibold tracking-[-0.01em]">
                  {item.question}
                </dt>
                <dd className="mt-2 text-[0.92rem] leading-relaxed text-muted text-pretty">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
