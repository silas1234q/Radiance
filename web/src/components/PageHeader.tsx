import type { ReactNode } from 'react'

/** Shared masthead for the standalone (non-home) pages. */
export default function PageHeader({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string
  title: string
  summary: string
  children?: ReactNode
}) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-faint">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-display text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance sm:text-5xl">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-relaxed text-muted text-pretty">
        {summary}
      </p>
      {children}
    </header>
  )
}
