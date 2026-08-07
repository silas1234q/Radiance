import { Plate, Pill } from './ui/Bits'
import { Underline, Sparkle } from './ui/Ink'
import Reveal from './ui/Reveal'

/** Mini-UI: the analysis card the app shows after a scan. */
function AnalysisMock() {
  return (
    <div className="rounded-2xl bg-page p-3.5">
      <Pill tint="lilac" className="text-[0.62rem]">
        Radiance AI
      </Pill>
      <p className="mt-2.5 text-[0.82rem] font-semibold">Glow score 8.6</p>
      <p className="text-[0.7rem] text-faint">Based on 42 skin signals</p>
      <div className="mt-3 flex gap-1.5">
        <Plate className="h-14 flex-1 rounded-lg" from="#ffdfe8" to="#e8a9c2" />
        <Plate className="h-14 flex-1 rounded-lg" from="#ffe8d6" to="#dbab9a" />
        <Plate className="h-14 flex-1 rounded-lg" from="#e7dcff" to="#b39fee" />
      </div>
    </div>
  )
}

/** Mini-UI: the assistant explaining today's change. */
function RoutineMock() {
  return (
    <div className="rounded-2xl bg-page p-3.5">
      <Pill tint="sky" className="text-[0.62rem]">
        6 Aug
      </Pill>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-primary to-lilac">
          <Sparkle className="h-3 w-3" color="#fff" />
        </span>
        <span className="text-[0.76rem] font-semibold">Radiance assistant</span>
        <span className="ml-auto text-[0.64rem] text-faint">Now</span>
      </div>
      <p className="mt-2.5 rounded-2xl rounded-tl-md bg-white p-2.5 text-[0.73rem] leading-snug text-muted">
        Swapped your exfoliant for a barrier cream — your skin read as sensitised this morning.
      </p>
      <div className="mt-2.5 flex items-center gap-2 rounded-full bg-white p-1 pl-3">
        <span className="flex-1 truncate text-[0.7rem] text-faint">Ask about today&rsquo;s routine</span>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary">
          <svg viewBox="0 0 14 14" className="h-2.5 w-2.5 stroke-white" fill="none">
            <path d="M2.5 7h9M7.5 3l4 4-4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  )
}

/** Mini-UI: today's completion feed. */
function ProgressMock() {
  const rows = [
    { icon: '✓', tint: 'bg-tint-mint text-mint', title: 'Morning routine done', detail: 'Hydration + barrier logged', time: '30 min' },
    { icon: '◐', tint: 'bg-tint-sky text-sky-600', title: 'Routine adjusted', detail: 'Optimised for today', time: 'just now' },
    { icon: '☾', tint: 'bg-tint-lilac text-lilac', title: 'Evening check-in', detail: 'Scheduled for 9:00 pm', time: 'tonight' },
  ]

  return (
    <div className="space-y-2 rounded-2xl bg-page p-3.5">
      <Pill className="text-[0.62rem]">Daily progress</Pill>
      {rows.map((r) => (
        <div key={r.title} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5">
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[0.7rem] font-bold ${r.tint}`}>
            {r.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.74rem] font-semibold leading-tight">{r.title}</p>
            <p className="truncate text-[0.68rem] leading-tight text-faint">{r.detail}</p>
          </div>
          <span className="shrink-0 text-[0.64rem] text-faint">{r.time}</span>
        </div>
      ))}
    </div>
  )
}

const cards = [
  {
    dot: '#F06680',
    title: 'Smart analysis',
    body: 'Your scan becomes numbers you can act on — hydration, barrier, texture and tone, read in real time.',
    mock: <AnalysisMock />,
  },
  {
    dot: '#9C8CF0',
    title: 'Adaptive routine',
    body: 'The AI learns your rhythm and rewrites the plan when your skin, weather or stress shifts.',
    mock: <RoutineMock />,
  },
  {
    dot: '#35B96A',
    title: 'Progress tracking',
    body: 'See small changes every day. Visual results and streaks keep you consistent without nagging.',
    mock: <ProgressMock />,
  },
]

export default function Features() {
  return (
    <section id="features" className="px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-[13ch] font-display text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance md:text-[3rem]">
              Personal care for your skin{' '}
              <span className="relative inline-block whitespace-nowrap">
                every day
                <Underline delay={0.35} />
              </span>
              <Sparkle className="ml-1.5 inline-block h-5 w-5 align-super md:h-6 md:w-6" color="#9C8CF0" />
            </h2>
            <p className="max-w-xs text-[0.95rem] leading-relaxed text-muted md:text-right">
              Track your natural glow with smart, adaptive insights that get sharper the longer you
              use them.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={80 * i}>
              <div className="soft lift flex h-full flex-col p-6">
                <div className="flex items-center gap-2">
                  <span
                    className="h-[0.45rem] w-[0.45rem] rounded-full"
                    style={{ backgroundColor: card.dot }}
                  />
                  <h3 className="font-display text-[1.15rem] font-semibold tracking-[-0.01em]">
                    {card.title}
                  </h3>
                </div>
                <p className="mt-2.5 text-[0.9rem] leading-relaxed text-muted">{card.body}</p>
                <div className="mt-5">{card.mock}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
