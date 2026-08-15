import { Link } from 'react-router'
import { faqGroups } from '../content/faq'
import { SUPPORT_EMAIL } from '../content/legal'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/ui/Reveal'
import { usePageMeta } from '../lib/usePageMeta'

export default function Help() {
  usePageMeta('Help centre', 'Answers to the questions people ask most about Radiance.')

  return (
    <section className="relative px-6 pt-12 pb-24 md:pt-16">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Help centre"
          title="Answers to the common questions"
          summary="If what you need is not here, email us and a person will reply."
        />

        <div className="mt-14">
          {faqGroups.map((group, i) => (
            <Reveal key={group.heading} delay={i * 60}>
              <div className="mb-12">
                <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-faint">
                  {group.heading}
                </h2>
                <div className="mt-4 space-y-3">
                  {group.entries.map((entry) => (
                    <details
                      key={entry.question}
                      className="group rounded-2xl border border-hair bg-card px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-4 text-[0.95rem] font-medium">
                        <span className="text-pretty">{entry.question}</span>
                        <svg
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          className="h-3.5 w-3.5 shrink-0 fill-none stroke-faint stroke-[2] transition-transform duration-300 group-open:rotate-45"
                        >
                          <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                        </svg>
                      </summary>
                      <p className="mt-3 text-[0.92rem] leading-[1.7] text-muted text-pretty">
                        {entry.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-hair bg-card p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-[1.05rem] font-semibold tracking-[-0.01em]">
              Still stuck?
            </p>
            <p className="mt-1 text-[0.88rem] text-muted">
              Email us and we will get back to you.
            </p>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary"
          >
            Contact support
          </a>
        </div>

        <p className="mt-8 text-center text-[0.82rem] text-faint">
          See also our{' '}
          <Link to="/privacy" className="text-muted underline underline-offset-2 hover:text-primary">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link to="/terms" className="text-muted underline underline-offset-2 hover:text-primary">
            Terms of Use
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
