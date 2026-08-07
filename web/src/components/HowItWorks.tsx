import type { ReactNode } from 'react'
import { PhoneFrame, ScanScreen, DashScreen } from './ui/Phone'
import { Pill, Check, PillButton, Plate } from './ui/Bits'
import { Underline, Sparkle } from './ui/Ink'
import Reveal from './ui/Reveal'

/** Middle panel: the quiz answers stacking up into a profile. */
function QuizPanel() {
  const answers = [
    ['Skin type', 'Combination'],
    ['Main concern', 'Dullness'],
    ['Sensitivity', 'Moderate'],
    ['Sleep', '6–7 hrs'],
  ]

  return (
    <div className="w-full max-w-[17rem] space-y-2">
      {answers.map(([q, a], i) => (
        <div
          key={q}
          className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_10px_26px_-16px_rgb(46_24_60/0.4)] backdrop-blur-md"
          style={{ marginLeft: `${i % 2 ? 1.2 : 0}rem`, marginRight: `${i % 2 ? 0 : 1.2}rem` }}
        >
          <span className="text-[0.76rem] text-muted">{q}</span>
          <span className="text-[0.8rem] font-semibold">{a}</span>
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-[0.8rem] font-semibold text-white">
        <Sparkle className="h-3.5 w-3.5" color="#fff" />
        Building your profile
      </div>
    </div>
  )
}

type Step = {
  n: string
  tag: string
  title: string
  body: string
  checks: string[]
  panel: ReactNode
  from: string
  to: string
  cta?: string
}

const steps: Step[] = [
  {
    n: '01',
    tag: 'Scan',
    title: 'Analyse your glow',
    body: 'Point the camera once. Radiance captures hydration, balance and stress signals from your skin — setting your care tone for the day.',
    checks: ['Real-time skin scan results', 'Personalised hydration score', 'UV and humidity detection'],
    panel: (
      <div className="w-[11.5rem]">
        <PhoneFrame>
          <ScanScreen />
        </PhoneFrame>
      </div>
    ),
    from: '#ffd9e6',
    to: '#f7b8cf',
  },
  {
    n: '02',
    tag: 'Understand',
    title: 'Answer a few questions',
    body: 'A ninety-second quiz fills in what a camera cannot see — lifestyle, sensitivity, sleep and the goals you actually care about.',
    checks: ['Under two minutes to complete', 'Ingredient sensitivities flagged', 'Goals you can change any time'],
    panel: <QuizPanel />,
    from: '#e8ddff',
    to: '#c0abf0',
  },
  {
    n: '03',
    tag: 'Glow',
    title: 'Follow a routine that moves',
    body: 'Your AM and PM steps arrive with the reasoning behind each one — and quietly rewrite themselves as your skin changes.',
    checks: ['AM and PM routines with rationale', 'Streaks and XP that keep you going', 'Progress you can actually see'],
    panel: (
      <div className="w-[11.5rem]">
        <PhoneFrame>
          <DashScreen />
        </PhoneFrame>
      </div>
    ),
    from: '#d8ecff',
    to: '#a9c6f0',
    cta: 'Start your free scan',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-[14ch] font-display text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance md:text-[3rem]">
              See how Radiance cares for you{' '}
              <span className="relative inline-block whitespace-nowrap">
                every day
                <Underline delay={0.35} />
              </span>
            </h2>
            <p className="max-w-xs text-[0.95rem] leading-relaxed text-muted md:text-right">
              Explore the app that learns from your skin, then gets out of your way.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 space-y-4">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={60 * i}>
              <div className="soft grid items-center gap-8 overflow-hidden p-5 md:grid-cols-2 md:p-6">
                {/* tinted panel */}
                <div
                  className={`relative flex min-h-[19rem] items-center justify-center overflow-hidden rounded-3xl p-6 ${
                    i % 2 ? 'md:order-2' : ''
                  }`}
                >
                  <Plate className="absolute inset-0" from={step.from} to={step.to} />
                  <span className="absolute left-5 top-4 font-display text-[3.4rem] font-bold leading-none text-white/45">
                    {step.n}
                  </span>
                  <div className="relative">{step.panel}</div>
                </div>

                {/* copy */}
                <div className={`px-1 md:px-6 ${i % 2 ? 'md:order-1' : ''}`}>
                  <Pill tint={i === 1 ? 'lilac' : i === 2 ? 'sky' : 'pink'}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {step.tag}
                  </Pill>
                  <h3 className="mt-4 font-display text-[1.7rem] font-semibold tracking-[-0.02em] md:text-[2rem]">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted">
                    {step.body}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {step.checks.map((c) => (
                      <Check key={c}>{c}</Check>
                    ))}
                  </ul>
                  {step.cta && (
                    <PillButton className="mt-7" href="#get">
                      {step.cta}
                      <Sparkle className="h-3.5 w-3.5" color="#fff" />
                    </PillButton>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
