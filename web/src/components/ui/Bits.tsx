import type { ReactNode } from 'react'

const tints = {
  pink: 'bg-tint-pink text-primary',
  lilac: 'bg-tint-lilac text-lilac',
  sky: 'bg-tint-sky text-sky-600',
  mint: 'bg-tint-mint text-mint',
  ink: 'bg-ink/5 text-muted',
} as const

/** Small rounded label — the tag that sits above a heading or inside a mockup. */
export function Pill({
  children,
  tint = 'pink',
  className = '',
}: {
  children: ReactNode
  tint?: keyof typeof tints
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${tints[tint]} ${className}`}
    >
      {children}
    </span>
  )
}

/** Green tick used by the feature checklists. */
export function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[0.95rem] text-ink">
      <span className="mt-0.5 grid h-[1.15rem] w-[1.15rem] shrink-0 place-items-center rounded-md bg-mint">
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 stroke-white" fill="none" aria-hidden="true">
          <path d="M2.5 6.2 5 8.5l4.5-5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children}
    </li>
  )
}

/** Coloured status dot that precedes a card title. */
export function Dot({ color = '#F06680' }: { color?: string }) {
  return (
    <span
      className="inline-block h-[0.42rem] w-[0.42rem] shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  )
}

/** Pink capsule button, the primary CTA shape throughout the page. */
export function PillButton({
  children,
  href = '#get',
  variant = 'primary',
  className = '',
}: {
  children: ReactNode
  href?: string
  variant?: 'primary' | 'ink' | 'ghost'
  className?: string
}) {
  const styles = {
    primary:
      'bg-primary text-white shadow-[0_10px_24px_-10px_rgb(240_102_128/0.9)] hover:bg-[#e2536f]',
    ink: 'bg-ink text-white hover:bg-[#2c2a34]',
    ghost: 'border border-hair bg-white text-ink hover:border-primary/40 hover:text-primary',
  }[variant]

  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.9rem] font-semibold transition-all duration-300 hover:-translate-y-0.5 ${styles} ${className}`}
    >
      {children}
    </a>
  )
}

/** Decorative gradient plate standing in for app photography. */
export function Plate({
  className = '',
  from = '#ffd7e3',
  to = '#c9b6f2',
}: {
  className?: string
  from?: string
  to?: string
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 28%, rgb(255 255 255 / 0.6) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
