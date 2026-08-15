import { Link } from 'react-router'
import type { FeaturePage } from '../content/features'
import { featurePages } from '../content/features'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/ui/Reveal'
import { usePageMeta } from '../lib/usePageMeta'

export default function FeatureRoute({ page }: { page: FeaturePage }) {
  usePageMeta(page.eyebrow, page.summary)

  const others = featurePages.filter((p) => p.slug !== page.slug)

  return (
    <section className="relative px-6 pt-12 pb-24 md:pt-16">
      <div className="mx-auto max-w-5xl">
        <PageHeader eyebrow={page.eyebrow} title={page.title} summary={page.summary} />

        {/* Highlight cards */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {page.highlights.map((highlight, i) => (
            <Reveal key={highlight.title} delay={i * 70}>
              <div className="h-full rounded-2xl border border-hair bg-card p-6">
                <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.01em]">
                  {highlight.title}
                </h2>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-muted text-pretty">
                  {highlight.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Long-form sections */}
        <div className="mx-auto mt-20 max-w-2xl">
          {page.sections.map((section, i) => (
            <Reveal key={section.title} delay={i * 60}>
              <section className="mb-14">
                <h2 className="font-display text-[1.5rem] font-semibold tracking-[-0.02em] text-balance">
                  {section.title}
                </h2>
                {section.body.map((paragraph, j) => (
                  <p
                    key={j}
                    className="mt-4 text-[0.98rem] leading-[1.75] text-muted text-pretty"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            </Reveal>
          ))}
        </div>

        {/* Sibling features */}
        <div className="mt-8 border-t border-hair pt-12">
          <h2 className="text-center text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-faint">
            Also in Radiance
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {others.map((other) => (
              <Link
                key={other.slug}
                to={`/${other.slug}`}
                className="group rounded-2xl border border-hair bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
              >
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-faint">
                  {other.eyebrow}
                </p>
                <p className="mt-2 font-display text-[1.05rem] font-semibold tracking-[-0.01em] transition-colors group-hover:text-primary">
                  {other.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
