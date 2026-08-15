import { skin3 } from '../assets/skins'
import { Plate, Pill } from './ui/Bits'
import { Underline, Sparkle } from './ui/Ink'
import Reveal from './ui/Reveal'

/** Mini-UI: the metric readout the analysis produces from a scan. */
function AnalysisMock() {
  const metrics = [
    { label: 'Hydration', value: 78, tone: 'bg-sky-400' },
    { label: 'Oil balance', value: 64, tone: 'bg-primary' },
    { label: 'Texture', value: 71, tone: 'bg-lilac' },
    { label: 'Even tone', value: 83, tone: 'bg-mint' },
  ]

  return (
    <div className="rounded-2xl bg-page p-3.5">
      <Pill tint="lilac" className="text-[0.62rem]">
        Radiance AI
      </Pill>
      <p className="mt-2.5 text-[0.82rem] font-semibold">Skin health score 72</p>
      <p className="text-[0.7rem] text-faint">From your quiz and your last scan</p>
      <div className="mt-3 space-y-1.5">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <span className="w-[4.6rem] shrink-0 text-[0.66rem] text-muted">{m.label}</span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-hair">
              <span
                className={`block h-full rounded-full ${m.tone}`}
                style={{ width: `${m.value}%` }}
              />
            </span>
            <span className="w-4 shrink-0 text-right text-[0.66rem] font-semibold">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Mini-UI: an AM routine step with the reason the AI attached to it. */
function RoutineMock() {
  return (
    <div className="rounded-2xl bg-page p-3.5">
      <div className="flex items-center justify-between">
        <Pill tint="sky" className="text-[0.62rem]">
          AM routine
        </Pill>
        <span className="text-[0.64rem] font-semibold text-faint">Step 2 of 4</span>
      </div>

      <div className="mt-2.5 rounded-xl bg-white p-2.5">
        <div className="flex items-center gap-2">
          <span className="h-7 w-5 shrink-0 rounded-md bg-gradient-to-b from-[#ffe6ee] to-[#f6bdd1]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.75rem] font-semibold leading-tight">Niacinamide 5%</p>
            <p className="truncate text-[0.66rem] leading-tight text-faint">
              After cleansing, before SPF
            </p>
          </div>
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-hair">
            <svg viewBox="0 0 12 12" className="h-2 w-2 stroke-faint" fill="none">
              <path d="M2.5 6.2 5 8.5l4.5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <p className="mt-2 flex gap-1.5 border-t border-hair pt-2 text-[0.68rem] leading-snug text-muted">
          <Sparkle className="mt-0.5 h-2.5 w-2.5 shrink-0" color="#9C8CF0" />
          Chosen for the uneven tone you flagged — gentle enough for daily use.
        </p>
      </div>
    </div>
  )
}

/** Mini-UI: a scanned product scored against the user's profile. */
function ShelfMock() {
  return (
    <div className="rounded-2xl bg-page p-3.5">
      <Pill className="text-[0.62rem]">My shelf</Pill>

      <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-white p-2.5">
        <Plate className="h-11 w-9 shrink-0 rounded-lg" src={skin3} from="#ffe8d6" to="#dbab9a" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.75rem] font-semibold leading-tight">Barrier repair cream</p>
          <p className="mt-1 flex items-center gap-1.5">
            <span className="h-1 w-12 overflow-hidden rounded-full bg-hair">
              <span className="block h-full w-[88%] rounded-full bg-mint" />
            </span>
            <span className="text-[0.66rem] font-bold text-mint">88 fit</span>
          </p>
        </div>
      </div>

      <div className="mt-2 space-y-1.5">
        <p className="flex items-start gap-1.5 rounded-lg bg-tint-mint px-2 py-1.5 text-[0.66rem] leading-snug text-mint">
          <span className="font-bold">+</span> Ceramides suit your recovering barrier
        </p>
        <p className="flex items-start gap-1.5 rounded-lg bg-tint-pink px-2 py-1.5 text-[0.66rem] leading-snug text-primary">
          <span className="font-bold">!</span> Contains fragrance — you flagged this
        </p>
      </div>
    </div>
  )
}

const cards = [
  {
    dot: '#F06680',
    title: 'Skin analysis',
    body: 'Your quiz and your scan become a score you can act on — hydration, oil balance, texture and tone, each tracked separately.',
    mock: <AnalysisMock />,
  },
  {
    dot: '#9C8CF0',
    title: 'Routines with reasons',
    body: 'AM and PM steps in the order they belong, each carrying the reason it was picked for your skin — and rewritten as your skin changes.',
    mock: <RoutineMock />,
  },
  {
    dot: '#35B96A',
    title: 'Products, checked',
    body: 'Scan or search anything on your shelf and see how it fits your profile, down to the ingredients you asked Radiance to watch.',
    mock: <ShelfMock />,
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
