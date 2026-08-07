import { PhoneFrame, DashScreen } from './ui/Phone'
import { Plate, Pill } from './ui/Bits'
import { Circled, Sparkle } from './ui/Ink'
import Reveal from './ui/Reveal'

const signals = [
  {
    tone: 'bg-primary',
    title: 'UV exposure detected',
    detail: 'Daytime protection recommended',
    time: '1h ago',
  },
  {
    tone: 'bg-lilac',
    title: 'Stress signals noted',
    detail: 'Routine simplified for recovery',
    time: '3h ago',
  },
  {
    tone: 'bg-sky-400',
    title: 'Humidity dropped 18%',
    detail: 'Hydrating layer added to PM',
    time: '5h ago',
  },
]

export default function Bento() {
  return (
    <section id="science" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="mx-auto max-w-[16ch] text-center font-display text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.03em] text-balance md:text-[3.1rem]">
            Designed to understand your{' '}
            <span className="relative inline-block whitespace-nowrap">
              skin&rsquo;s
              <Circled delay={0.3} />
            </span>{' '}
            nature
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
          {/* Tall phone card */}
          <Reveal className="lg:row-span-2" delay={60}>
            <div className="soft lift flex h-full flex-col gap-6 p-6">
              <div className="relative flex justify-center pt-2">
                <div
                  className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-64 w-56 rounded-full opacity-80 blur-2xl"
                  style={{ background: 'radial-gradient(closest-side,#ffe1ec,transparent)' }}
                />
                <div className="relative w-[11.5rem]">
                  <PhoneFrame>
                    <DashScreen />
                  </PhoneFrame>
                </div>
              </div>
              <p className="mt-auto text-[0.92rem] leading-relaxed text-muted">
                <span className="font-semibold text-ink">Quick face scan</span> gives real-time
                hydration, glow and balance metrics — no clinic visit, no guesswork.
              </p>
            </div>
          </Reveal>

          {/* Wide environment card */}
          <Reveal className="lg:col-span-2" delay={120}>
            <div className="soft lift grid h-full gap-6 p-6 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="font-display text-[1.25rem] font-semibold tracking-[-0.01em]">
                  Skin environment
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">
                  Radiance watches the UV index, humidity and pollution around you, then quietly
                  adjusts what your routine asks of you today.
                </p>
              </div>

              <div className="rounded-2xl bg-page p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[0.8rem] font-semibold">Daily skin signals</span>
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 stroke-faint" fill="none">
                    <rect x="1.5" y="2.5" width="13" height="12" rx="2.5" strokeWidth="1.4" />
                    <path d="M1.5 6h13M5 1.5v2M11 1.5v2" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="mt-3 space-y-3">
                  {signals.map((s) => (
                    <div key={s.title} className="flex items-start gap-2.5">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.tone}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.78rem] font-semibold leading-tight">{s.title}</p>
                        <p className="mt-0.5 text-[0.72rem] leading-tight text-faint">{s.detail}</p>
                      </div>
                      <span className="shrink-0 text-[0.66rem] text-faint">{s.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Progress tile */}
          <Reveal delay={180}>
            <div className="lift relative h-full min-h-[15rem] overflow-hidden rounded-3xl">
              <Plate className="absolute inset-0" from="#ffd6c9" to="#8d6d8f" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
              <div className="relative flex h-full flex-col justify-between p-5 text-white">
                <p className="max-w-[15ch] text-[0.92rem] font-semibold leading-snug">
                  Adapts your routine to weather and stress.
                </p>
                <div>
                  <p className="font-display text-3xl font-bold leading-none">3 weeks</p>
                  <p className="mt-1 text-[0.75rem] text-white/70">of visible change</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* AI assistant card */}
          <Reveal delay={240}>
            <div className="soft lift flex h-full flex-col gap-4 p-6">
              <div className="rounded-2xl bg-page p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-primary to-lilac">
                      <Sparkle className="h-3 w-3" color="#fff" />
                    </span>
                    <span className="text-[0.78rem] font-semibold">AI assistant</span>
                  </span>
                  <span className="text-[0.66rem] text-faint">Today</span>
                </div>

                <p className="mt-3 rounded-2xl rounded-tl-md bg-white p-3 text-[0.76rem] leading-snug text-muted">
                  I&rsquo;ve updated your routine to match how your skin feels today.
                </p>

                <div className="mt-3 flex items-center gap-2 rounded-full bg-white p-1 pl-3.5">
                  <span className="flex-1 truncate text-[0.72rem] text-faint">
                    See today&rsquo;s adjustments&hellip;
                  </span>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary">
                    <svg viewBox="0 0 14 14" className="h-3 w-3 stroke-white" fill="none">
                      <path d="M2.5 7h9M7.5 3l4 4-4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>

              <p className="mt-auto text-[0.92rem] leading-relaxed text-muted">
                <span className="font-semibold text-ink">Personalised tips</span> based on your
                scan, lifestyle and daily habits.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-3xl border border-hair bg-white/60 px-6 py-5">
            {[
              ['42', 'skin signals read per scan'],
              ['3 weeks', 'median time to visible change'],
              ['2×', 'daily routine adjustments'],
            ].map(([stat, label]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="font-display text-xl font-bold text-primary">{stat}</span>
                <span className="text-[0.82rem] text-muted">{label}</span>
              </div>
            ))}
            <Pill tint="mint" className="ml-auto hidden md:inline-flex">
              Dermatologist reviewed
            </Pill>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
