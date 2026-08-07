/**
 * Hand-drawn marginalia — the wobbly underline, the circled word, and the
 * little burst. Each path is deliberately imperfect so it reads as pen on
 * paper rather than a vector shape, and each draws itself on load.
 */

type InkProps = {
  className?: string
  delay?: number
  color?: string
}

/** Loose double underline that sits beneath a word. */
export function Underline({ className = '', delay = 0.7, color = '#F06680' }: InkProps) {
  return (
    <svg
      className={`ink pointer-events-none absolute -bottom-[0.18em] left-0 h-[0.3em] w-full ${className}`}
      viewBox="0 0 220 18"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M3 11.5c34-5.2 71.5-7.1 107-6.4 33 .6 65.3 3.4 107 8.4"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        style={{ ['--len' as string]: 230, ['--delay' as string]: `${delay}s` }}
      />
      <path
        d="M14 16c40-3.6 82-4.6 122-3.2 24 .8 47 2.3 70 4.4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
        style={{ ['--len' as string]: 210, ['--delay' as string]: `${delay + 0.16}s` }}
      />
    </svg>
  )
}

/** Scribbled ellipse that lassos a word — sized to its inline parent. */
export function Circled({ className = '', delay = 0.75, color = '#F06680' }: InkProps) {
  return (
    <svg
      className={`ink pointer-events-none absolute -inset-x-[0.35em] -inset-y-[0.18em] ${className}`}
      viewBox="0 0 200 70"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M104 6C58 3 12 14 7 33c-4 16 30 30 84 32 46 2 96-8 102-27 4-14-20-26-58-31"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        style={{ ['--len' as string]: 470, ['--delay' as string]: `${delay}s` }}
      />
    </svg>
  )
}

/** Four-point sparkle, the "this bit is delightful" mark. */
export function Sparkle({ className = '', color = '#F06680' }: InkProps) {
  return (
    <svg
      className={`twinkle pointer-events-none ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 1.5c.9 5.2 3.4 8 9 9-5.6 1-8.1 3.8-9 9-.9-5.2-3.4-8-9-9 5.6-1 8.1-3.8 9-9Z"
        fill={color}
      />
    </svg>
  )
}

/** Tiny arc-and-dashes flourish, borrowed from the reference's headline. */
export function Flourish({ className = '', delay = 0.9, color = '#F06680' }: InkProps) {
  return (
    <svg
      className={`ink pointer-events-none ${className}`}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 30C10 18 18 9 32 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        style={{ ['--len' as string]: 40, ['--delay' as string]: `${delay}s` }}
      />
      <path
        d="M2 20c1.4 2 2.2 4.3 2.4 7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        style={{ ['--len' as string]: 12, ['--delay' as string]: `${delay + 0.12}s` }}
      />
      <path
        d="M16 36c2.6-.4 5-.3 7.4.3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        style={{ ['--len' as string]: 12, ['--delay' as string]: `${delay + 0.2}s` }}
      />
    </svg>
  )
}
