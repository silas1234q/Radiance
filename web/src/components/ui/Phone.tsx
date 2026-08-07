import type { ReactNode } from 'react'

/**
 * Device shell. The screen is a plain slot so each section can drop a
 * different piece of the Radiance app into it.
 */
export function PhoneFrame({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative rounded-[2.6rem] bg-[#1b1a20] p-[0.42rem] shadow-[0_38px_70px_-24px_rgb(46_24_60/0.55),0_0_0_1px_rgb(255_255_255/0.08)_inset] ${className}`}
    >
      {/* side buttons */}
      <span className="absolute -left-[2px] top-[22%] h-9 w-[3px] rounded-l-full bg-[#2e2c36]" />
      <span className="absolute -left-[2px] top-[34%] h-14 w-[3px] rounded-l-full bg-[#2e2c36]" />
      <span className="absolute -right-[2px] top-[28%] h-16 w-[3px] rounded-r-full bg-[#2e2c36]" />

      <div className="relative overflow-hidden rounded-[2.25rem] bg-white">
        {/* dynamic island */}
        <div className="absolute left-1/2 top-2 z-20 h-[1.15rem] w-[4.6rem] -translate-x-1/2 rounded-full bg-[#1b1a20]" />
        {children}
      </div>
    </div>
  )
}

function StatusBar({ dark = false }: { dark?: boolean }) {
  const tone = dark ? 'text-white' : 'text-ink'
  return (
    <div className={`flex items-center justify-between px-5 pt-3 text-[0.6rem] font-semibold ${tone}`}>
      <span>9:41</span>
      <span className="flex items-center gap-1">
        <svg viewBox="0 0 18 12" className="h-2.5 w-4 fill-current" aria-hidden="true">
          <rect x="0" y="7" width="3" height="5" rx="1" />
          <rect x="4.5" y="5" width="3" height="7" rx="1" />
          <rect x="9" y="2.5" width="3" height="9.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="12" rx="1" opacity="0.35" />
        </svg>
        <svg viewBox="0 0 26 12" className="h-2.5 w-5 fill-none stroke-current" aria-hidden="true">
          <rect x="0.75" y="0.75" width="20" height="10.5" rx="3" strokeWidth="1.2" opacity="0.5" />
          <rect x="2.5" y="2.5" width="14" height="7" rx="1.6" className="fill-current" stroke="none" />
          <path d="M23 4.2v3.6" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </svg>
      </span>
    </div>
  )
}

/**
 * Face-scan screen — the hero. Abstract portrait plate under the capture
 * guide, mesh landmarks, and a sweeping analysis line.
 */
export function ScanScreen() {
  return (
    <div className="relative aspect-[9/19] w-full overflow-hidden bg-[#17161c]">
      <StatusBar dark />

      {/* portrait plate */}
      <div className="absolute inset-x-0 bottom-0 top-9">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 46% at 50% 34%, #f7d9c9 0%, #eab9b0 42%, #b48397 72%, #4a3550 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(38% 26% at 50% 33%, rgb(255 255 255 / 0.55) 0%, transparent 70%)',
          }}
        />
        {/* shoulders */}
        <div className="absolute -bottom-6 left-1/2 h-32 w-[130%] -translate-x-1/2 rounded-[50%] bg-[#3a2b47]/70 blur-md" />
      </div>

      {/* capture guide + landmarks */}
      <svg
        viewBox="0 0 180 380"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden="true"
      >
        <ellipse
          cx="90"
          cy="150"
          rx="55"
          ry="72"
          stroke="rgb(255 255 255 / 0.85)"
          strokeWidth="1.4"
          strokeDasharray="5 7"
        />
        {/* corner brackets */}
        <g stroke="#F06680" strokeWidth="2.4" strokeLinecap="round">
          <path d="M30 96v-12h12M150 96v-12h-12M30 204v12h12M150 204v12h-12" />
        </g>
        {/* landmark mesh */}
        <g fill="rgb(255 255 255 / 0.9)">
          {[
            [72, 132], [108, 132], [90, 152], [90, 168], [74, 182], [106, 182],
            [62, 150], [118, 150], [90, 108], [78, 196], [102, 196],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.9" />
          ))}
        </g>
        <g stroke="rgb(255 255 255 / 0.35)" strokeWidth="0.7">
          <path d="M72 132 90 152 108 132M62 150 74 182 90 168 106 182 118 150M78 196 90 168 102 196" />
        </g>
      </svg>

      {/* analysis sweep */}
      <div
        className="scan-sweep absolute inset-x-0 top-16 h-14"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgb(240 102 128 / 0.38) 55%, rgb(255 255 255 / 0.65) 92%, transparent)',
        }}
      />

      <div className="absolute inset-x-0 bottom-0 space-y-3 p-4">
        <div className="flex items-center justify-center gap-2 rounded-full bg-white/15 py-2 text-[0.62rem] font-semibold text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" />
          Face detected · hold still
        </div>
        <div className="mx-auto h-[3.4rem] w-[3.4rem] rounded-full border-[3px] border-white/80 p-[3px]">
          <div className="h-full w-full rounded-full bg-white" />
        </div>
      </div>
    </div>
  )
}

/** Dashboard screen — glow score ring, metrics, routine checklist. */
export function DashScreen() {
  const score = 86
  const r = 34
  const c = 2 * Math.PI * r

  const metrics = [
    { label: 'Hydration', value: 78, tone: 'bg-sky-400' },
    { label: 'Barrier', value: 91, tone: 'bg-mint' },
    { label: 'Texture', value: 64, tone: 'bg-primary' },
  ]

  return (
    <div className="relative aspect-[9/19] w-full overflow-hidden bg-page">
      <StatusBar />

      <div className="space-y-2.5 p-3.5 pt-7">
        <div>
          <p className="text-[0.58rem] font-medium text-faint">Tuesday, 6 August</p>
          <p className="font-display text-[0.95rem] font-semibold">Morning, Ama</p>
        </div>

        {/* glow score */}
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#fff1f5] to-[#f4ecff] p-2.5">
          <div className="relative h-[4.3rem] w-[4.3rem] shrink-0">
            <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
              <circle cx="40" cy="40" r={r} stroke="#fff" strokeWidth="7" fill="none" />
              <circle
                cx="40"
                cy="40"
                r={r}
                stroke="#F06680"
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - score / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-lg font-bold leading-none">{score}</span>
              <span className="text-[0.48rem] font-medium text-faint">glow</span>
            </div>
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-[0.62rem] font-semibold leading-snug">Up 6 points this week</p>
            <p className="text-[0.55rem] leading-snug text-muted">
              Barrier recovery is holding. Keep the PM routine steady.
            </p>
          </div>
        </div>

        {/* metrics */}
        <div className="space-y-2 rounded-2xl border border-hair bg-white p-2.5">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1">
              <div className="flex justify-between text-[0.55rem] font-medium">
                <span className="text-muted">{m.label}</span>
                <span>{m.value}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-hair">
                <div className={`h-full rounded-full ${m.tone}`} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* routine */}
        <div className="space-y-2 rounded-2xl border border-hair bg-white p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.6rem] font-semibold">AM routine</span>
            <span className="rounded-full bg-tint-mint px-1.5 py-0.5 text-[0.48rem] font-semibold text-mint">
              2 / 4
            </span>
          </div>
          {[
            ['Gentle gel cleanser', true],
            ['Niacinamide 5%', true],
            ['Ceramide moisturiser', false],
            ['SPF 50 fluid', false],
          ].map(([label, done]) => (
            <div key={label as string} className="flex items-center gap-2">
              <span
                className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${
                  done ? 'bg-mint' : 'border border-hair'
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 12 12" className="h-2 w-2 stroke-white" fill="none">
                    <path d="M2.5 6.2 5 8.5l4.5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
              <span
                className={`text-[0.55rem] ${done ? 'text-faint line-through' : 'font-medium'}`}
              >
                {label as string}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* The list runs past the fold on purpose — fade it out and cap it with a
          home indicator so the cut reads as a real screen, not a clipped div. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-page via-page/85 to-transparent" />
      <div className="absolute bottom-1.5 left-1/2 h-1 w-16 -translate-x-1/2 rounded-full bg-ink/25" />
    </div>
  )
}
