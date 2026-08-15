import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  LAST_UPDATED,
  SUPPORT_EMAIL,
  privacyPolicy,
  termsOfUse,
  type LegalDocument,
} from '../content/legal'
import { usePageMeta } from '../lib/usePageMeta'

/** Turns bare support-email mentions in the copy into mailto links. */
function linkifyEmail(text: string): ReactNode {
  const parts = text.split(SUPPORT_EMAIL)
  if (parts.length === 1) return text

  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
        >
          {SUPPORT_EMAIL}
        </a>
      )}
    </span>
  ))
}

/** `Privacy Policy` -> `privacy-policy`, for the in-page anchors. */
function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function LegalPage({ doc }: { doc: LegalDocument }) {
  const other = doc.slug === 'privacy' ? termsOfUse : privacyPolicy

  usePageMeta(doc.title, doc.summary)

  return (
    <section className="relative px-6 pt-12 pb-24 md:pt-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-faint">Legal</p>

        <h1 className="mt-3 font-display text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance sm:text-5xl">
          {doc.title}
        </h1>

        <p className="mt-4 text-[1.02rem] leading-relaxed text-muted text-pretty">{doc.summary}</p>

        <p className="mt-6 text-[0.8rem] text-faint">Last updated: {LAST_UPDATED}</p>

        {/* Contents */}
        <nav aria-label="Contents" className="mt-10 rounded-2xl border border-hair bg-card p-6">
          <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-faint">
            Contents
          </h2>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {doc.sections.map((section, i) => (
              <li key={section.title}>
                <a
                  href={`#${slugify(section.title)}`}
                  className="text-[0.88rem] text-muted transition-colors hover:text-primary"
                >
                  <span className="text-faint tabular-nums">{i + 1}.</span> {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 border-t border-hair pt-10">
          {doc.intro.map((paragraph, i) => (
            <p key={i} className="mb-5 text-[0.98rem] leading-[1.75] text-muted text-pretty">
              {linkifyEmail(paragraph)}
            </p>
          ))}

          {doc.sections.map((section, i) => (
            <section key={section.title} id={slugify(section.title)} className="scroll-mt-28">
              <h2 className="mt-11 mb-4 font-display text-[1.35rem] font-semibold tracking-[-0.02em]">
                <span className="mr-2 text-faint tabular-nums">{i + 1}.</span>
                {section.title}
              </h2>
              {section.body.map((paragraph, j) => (
                <p key={j} className="mb-4 text-[0.98rem] leading-[1.75] text-muted text-pretty">
                  {linkifyEmail(paragraph)}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* Cross-link to the sibling document */}
        <div className="mt-16 flex flex-col items-start justify-between gap-4 rounded-2xl border border-hair bg-card p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-[1.05rem] font-semibold tracking-[-0.01em]">
              {other.title}
            </p>
            <p className="mt-1 text-[0.88rem] text-muted">{other.summary}</p>
          </div>
          <Link
            to={`/${other.slug}`}
            className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-[0.85rem] font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary"
          >
            Read it
          </Link>
        </div>
      </div>
    </section>
  )
}
