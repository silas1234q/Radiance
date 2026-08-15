import { Link } from 'react-router'
import { SUPPORT_EMAIL } from '../content/legal'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/ui/Reveal'
import { usePageMeta } from '../lib/usePageMeta'

/**
 * Deliberately free of biography, team size, funding and founding dates —
 * nothing here asserts a fact that could turn out to be untrue. It states what
 * the product is for and what it will not do. Add the real story when you want
 * it told.
 */
const principles = [
  {
    title: 'Your skin, not the average skin',
    body: 'Skincare advice is written for everyone, which is why so little of it works for anyone. Every routine and every score in Radiance is built from your own answers and your own photos.',
  },
  {
    title: 'Show the reasoning',
    body: 'A recommendation you do not understand is one you will abandon. Every routine step carries the reason it is there, and every product comes with the cons as well as the pros.',
  },
  {
    title: 'Consistency over intensity',
    body: 'A twelve-step regimen you keep for a week beats nothing, but barely. We would rather build a short routine you actually finish, and make the streak worth keeping.',
  },
  {
    title: 'Honest about the limits',
    body: 'Radiance is not a dermatologist and does not pretend to be one. It does not diagnose, it does not treat, and when something needs a professional we will say so.',
  },
]

export default function About() {
  usePageMeta('About', 'Why Radiance exists, and what it will and will not do.')

  return (
    <section className="relative px-6 pt-12 pb-24 md:pt-16">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="About"
          title="Skincare that reads your skin, not the trend cycle"
          summary="Radiance exists because working out what your skin needs should not require a decade of trial, error and wasted money."
        />

        <div className="mt-16 space-y-6">
          <p className="text-[1.02rem] leading-[1.8] text-muted text-pretty">
            Most people learn skincare the expensive way. You read something, buy something, use it
            for a fortnight, cannot tell whether it did anything, and start again. The feedback loop
            is broken — skin changes slowly, memory is unreliable, and the mirror is a poor
            instrument.
          </p>
          <p className="text-[1.02rem] leading-[1.8] text-muted text-pretty">
            Radiance is an attempt to close that loop. Answer a quiz, optionally scan your face, and
            get a clear read on where your skin actually stands across hydration, oil balance,
            barrier strength, pigmentation and acne. Then follow a routine built around those
            results, and watch the numbers move — or not — with the photographic evidence sitting
            next to them.
          </p>
          <p className="text-[1.02rem] leading-[1.8] text-muted text-pretty">
            That last part matters most. Anyone can hand you a routine. The hard part is knowing
            whether it is working.
          </p>
        </div>

        <div className="mt-20">
          <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-faint">
            What we believe
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {principles.map((principle, i) => (
              <Reveal key={principle.title} delay={i * 70}>
                <div className="h-full rounded-2xl border border-hair bg-card p-6">
                  <h3 className="font-display text-[1.05rem] font-semibold tracking-[-0.01em]">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-muted text-pretty">
                    {principle.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 rounded-2xl border border-hair bg-card p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-[1.05rem] font-semibold tracking-[-0.01em]">
              Get in touch
            </p>
            <p className="mt-1 text-[0.88rem] text-muted">
              Questions, feedback, or something broken — we read everything.
            </p>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary"
          >
            Email us
          </a>
        </div>

        <p className="mt-8 text-center text-[0.82rem] text-faint">
          Read the{' '}
          <Link to="/privacy" className="text-muted underline underline-offset-2 hover:text-primary">
            Privacy Policy
          </Link>{' '}
          or browse the{' '}
          <Link to="/help" className="text-muted underline underline-offset-2 hover:text-primary">
            Help centre
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
