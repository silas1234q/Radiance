import { PhoneFrame, ScanScreen } from './ui/Phone'
import { Pill, Plate } from './ui/Bits'
import { Sparkle, Flourish } from './ui/Ink'

/**
 * Small glass card that orbits the phone. The reveal and the drift are kept on
 * separate elements — one element can only run one `animation` shorthand.
 */
function FloatCard({
  children,
  className = '',
  delay = 0,
  float = 'animate-float',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  float?: string
}) {
  return (
    <div
      className={`absolute hidden lg:block ${className}`}
      style={{ opacity: 0, animation: `rise .8s cubic-bezier(.22,.85,.3,1) ${delay}s forwards` }}
    >
      <div
        className={`rounded-2xl border border-white/80 bg-white/85 p-3 shadow-[0_16px_38px_-18px_rgb(46_24_60/0.4)] backdrop-blur-xl ${float}`}
        style={{ animationDelay: `${delay}s` }}
      >
        {children}
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative px-6 pt-12 pb-20 md:pt-16 md:pb-28">
      {/* halo behind the phone */}
      <div
        className="pointer-events-none absolute left-1/2 top-40 h-[34rem] w-[42rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, #ffd9e7 0%, #e8daff 45%, transparent 78%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl">


        {/* headline */}
        <h1
          className="relative mx-auto mt-7 max-w-[19ch] text-center font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.03em] text-balance sm:text-6xl md:text-[4.2rem]"
          style={{ opacity: 0, animation: 'rise .8s cubic-bezier(.22,.85,.3,1) .12s forwards' }}
        >
          Your AI partner for{' '}
          <span className="marker">
            <span>modern</span>
          </span>{' '}
          skin &amp; wellness
          <Flourish className="absolute -right-2 -top-6 h-9 w-9 md:-right-8 md:top-0 md:h-12 md:w-12" delay={1} />
        </h1>

        <p
          className="mx-auto mt-6 max-w-lg text-center text-[1.02rem] leading-relaxed text-muted text-pretty"
          style={{ opacity: 0, animation: 'rise .8s cubic-bezier(.22,.85,.3,1) .2s forwards' }}
        >
          One scan reads hydration, barrier and texture. Radiance turns that into an AM and PM
          routine that changes as your skin does.
        </p>
        {/* phone + orbiting cards — held in a narrow band so the cards stay
            tucked against the phone rather than drifting to the page edges */}
        <div className="relative mx-auto mt-14 flex max-w-3xl justify-center">
          <div
            className="w-[15.5rem] sm:w-[16.5rem]"
            style={{ opacity: 0, animation: 'rise 1s cubic-bezier(.22,.85,.3,1) .36s forwards' }}
          >
            <PhoneFrame>
              <ScanScreen />
            </PhoneFrame>
          </div>

          <FloatCard className="left-0 top-8 w-[11.5rem]" delay={0.6}>
            <div className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-mint">
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 stroke-white" fill="none">
                  <path d="M2.5 6.2 5 8.5l4.5-5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-[0.8rem] font-semibold">Analysis complete</span>
            </div>
          </FloatCard>

          <FloatCard className="-left-2 top-36 w-[13rem]" delay={0.78} float="animate-float-slow">
            <p className="text-[0.8rem] font-semibold leading-snug">
              Generate your personalised care plan
            </p>
            <div className="mt-2.5 flex gap-1.5">
              <Plate className="h-12 flex-1 rounded-lg" from="#ffd9e5" to="#f3b7cd" />
              <Plate className="h-12 flex-1 rounded-lg" from="#e6dcff" to="#bda8f0" />
              <Plate className="h-12 flex-1 rounded-lg" from="#dfeaff" to="#adc4f0" />
            </div>
          </FloatCard>

          <FloatCard className="right-0 top-20 w-[13.5rem]" delay={0.68} float="animate-float-slow">
            <p className="text-[0.82rem] font-semibold">Daily glow score: 8.6</p>
            <p className="mt-1 text-[0.72rem] leading-snug text-muted">
              Improving since your last analysis.
            </p>
            <div className="mt-2.5 flex h-6 items-end gap-1">
              {[38, 52, 44, 66, 58, 80, 92].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-sm bg-primary/25 last:bg-primary"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </FloatCard>

          <FloatCard className="-right-2 top-[17.5rem] w-[12.5rem]" delay={0.88}>
            <Pill tint="lilac" className="text-[0.62rem]">
              Progress update
            </Pill>
            <Plate className="mt-2 h-16 w-full rounded-xl" from="#ffe2d5" to="#d9b3c8" />
            <p className="mt-2 text-[0.72rem] font-medium text-muted">2 weeks of daily care</p>
          </FloatCard>
        </div>

        <p
          className="mt-8 text-center font-editorial text-[1.05rem] italic text-faint"
          style={{ opacity: 0, animation: 'rise .8s cubic-bezier(.22,.85,.3,1) .6s forwards' }}
        >
          Scan. Understand. Glow.
        </p>
      </div>
    </section>
  )
}
