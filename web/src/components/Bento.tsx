import { PhoneFrame, AnalysisShot } from './ui/Phone'
import { skin4 } from '../assets/skins'
import { Plate, Pill } from './ui/Bits'
import { Circled, Sparkle } from './ui/Ink'
import Reveal from './ui/Reveal'

/** Shelf rows — how a product scored against the user's profile. */
const shelf = [
  {
    name: 'Niacinamide 5% serum',
    note: 'Evens tone without irritating',
    fit: 92,
    tone: 'bg-mint',
    swatch: 'from-[#dff3e8] to-[#b6e3cb]',
  },
  {
    name: 'Ceramide moisturiser',
    note: 'Supports a recovering barrier',
    fit: 88,
    tone: 'bg-mint',
    swatch: 'from-[#ffe6ee] to-[#f6bdd1]',
  },
  {
    name: 'Foaming cleanser',
    note: 'Fragrance — you flagged this',
    fit: 34,
    tone: 'bg-primary',
    swatch: 'from-[#eee9ff] to-[#c9baf5]',
  },
]

/** Seven-day AM/PM completion strip shown on the streak card. */
const week = [
  { day: 'M', am: true, pm: true },
  { day: 'T', am: true, pm: true },
  { day: 'W', am: true, pm: true },
  { day: 'T', am: true, pm: false },
  { day: 'F', am: true, pm: true },
  { day: 'S', am: true, pm: true },
  { day: 'S', am: true, pm: false },
]

export default function Bento() {
  return (
    <section id="overview" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="mx-auto max-w-[16ch] text-center font-display text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.03em] text-balance md:text-[3.1rem]">
            Everything Radiance does for your{' '}
            <span className="relative inline-block whitespace-nowrap">
              skin
              <Circled delay={0.3} />
            </span>{' '}
            daily
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
                    <AnalysisShot />
                  </PhoneFrame>
                </div>
              </div>
              <p className="mt-auto text-[0.92rem] leading-relaxed text-muted">
                <span className="font-semibold text-ink">Your analysis screen</span> — skin health
                score, glow level and XP, and every scan plotted over time.
              </p>
            </div>
          </Reveal>

          {/* Wide product-shelf card */}
          <Reveal className="lg:col-span-2" delay={120}>
            <div className="soft lift grid h-full gap-6 p-6 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="font-display text-[1.25rem] font-semibold tracking-[-0.01em]">
                  Your shelf, checked
                </h3>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-muted">
                  Scan or search any product and Radiance scores how well it fits your skin profile —
                  with the pros, the cons and the ingredients you asked it to watch for.
                </p>
              </div>

              <div className="rounded-2xl bg-page p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[0.8rem] font-semibold">My shelf</span>
                  <span className="text-[0.66rem] text-faint">Fit score</span>
                </div>
                <div className="mt-3 space-y-2">
                  {shelf.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-2.5 rounded-xl bg-white p-2.5"
                    >
                      <span
                        className={`h-8 w-6 shrink-0 rounded-md bg-gradient-to-b ${p.swatch}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.76rem] font-semibold leading-tight">
                          {p.name}
                        </p>
                        <p className="mt-0.5 truncate text-[0.68rem] leading-tight text-faint">
                          {p.note}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${p.tone}`} />
                        <span className="text-[0.72rem] font-bold">{p.fit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Progress tile — the one photo in the grid */}
          <Reveal delay={180}>
            <div className="lift relative h-full min-h-[15rem] overflow-hidden rounded-3xl">
              <Plate className="absolute inset-0" src={skin4} from="#ffd6c9" to="#8d6d8f" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
              <div className="relative flex h-full flex-col justify-between p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="max-w-[12ch] font-display text-[1.15rem] font-semibold leading-snug">
                    Progress you can see
                  </h3>
                  <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[0.62rem] font-semibold backdrop-blur-md">
                    3 weeks
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold leading-none">86</span>
                    <span className="text-[0.72rem] font-semibold text-white/75">
                      from 74 at your first scan
                    </span>
                  </div>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/25">
                    <div className="h-full w-[86%] rounded-full bg-white" />
                  </div>
                  <p className="mt-2 text-[0.72rem] text-white/70">
                    Every scan saved, side by side
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Streaks + XP card */}
          <Reveal delay={240}>
            <div className="soft lift flex h-full flex-col gap-4 p-6">
              <div className="rounded-2xl bg-page p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-primary to-lilac">
                      <Sparkle className="h-3 w-3" color="#fff" />
                    </span>
                    <span className="text-[0.78rem] font-semibold">14-day streak</span>
                  </span>
                  <span className="text-[0.66rem] text-faint">1,240 XP</span>
                </div>

                <div className="mt-3.5 flex justify-between">
                  {week.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span className="text-[0.58rem] font-medium text-faint">{d.day}</span>
                      <span
                        className={`h-2.5 w-2.5 rounded-[0.28rem] ${d.am ? 'bg-primary' : 'bg-hair'}`}
                      />
                      <span
                        className={`h-2.5 w-2.5 rounded-[0.28rem] ${d.pm ? 'bg-lilac' : 'bg-hair'}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3.5 flex items-center gap-2 rounded-full bg-white p-1 pl-3.5">
                  <span className="flex-1 truncate text-[0.72rem] text-faint">
                    Missed Thursday? Restore it&hellip;
                  </span>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary">
                    <svg viewBox="0 0 14 14" className="h-3 w-3 stroke-white" fill="none">
                      <path d="M2.5 7h9M7.5 3l4 4-4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>

              <p className="mt-auto text-[0.92rem] leading-relaxed text-muted">
                <span className="font-semibold text-ink">Streaks and XP</span> for AM and PM — with a
                few restores for the days life gets in the way.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={300}>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-3xl border border-hair bg-white/60 px-6 py-5">
            {[
              ['5', 'skin metrics scored per scan'],
              ['90 sec', 'quiz to build your profile'],
              ['AM + PM', 'routines, rewritten as you change'],
            ].map(([stat, label]) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="font-display text-xl font-bold text-primary">{stat}</span>
                <span className="text-[0.82rem] text-muted">{label}</span>
              </div>
            ))}
            <Pill tint="mint" className="ml-auto hidden md:inline-flex">
              Every step explained
            </Pill>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
