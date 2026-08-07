import { Sparkle } from './ui/Ink'
import { Pill } from './ui/Bits'
import Reveal from './ui/Reveal'

function StoreButton({ store }: { store: 'app' | 'play' }) {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-2.5 rounded-2xl bg-ink px-5 py-3 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2c2a34]"
    >
      {store === 'app' ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.2 1.2-2.4 1.2-2.5-.1 0-2.4-.9-2.4-3.6ZM14.2 5.9c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.7-1.3Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L3.6 2.3ZM16.1 15.6l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1 .6 1 1.6 0 2.2l-3.8 2ZM15.9 15.8 12.9 12.7l-9.3 9.4c.3.4.9.4 1.5.1l10.8-6.4M15.9 8.6 5.1 2.4c-.6-.4-1.2-.3-1.5.1l9.3 9.3 3-3.2Z" />
        </svg>
      )}
      <span className="text-left leading-none">
        <span className="block text-[0.6rem] text-white/60">Download on the</span>
        <span className="block text-[0.9rem] font-semibold">
          {store === 'app' ? 'App Store' : 'Google Play'}
        </span>
      </span>
    </a>
  )
}

export default function CTA() {
  return (
    <section id="get" className="px-6 pb-20 pt-4 md:pb-24">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-16 text-center md:py-20">
          {/* aurora, echoing the page's backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(40rem 22rem at 18% 10%, #ffd0e4 0%, transparent 62%),' +
                'radial-gradient(34rem 22rem at 84% 6%, #cdb9ff 0%, transparent 60%),' +
                'radial-gradient(32rem 20rem at 74% 96%, #ffb3c9 0%, transparent 64%),' +
                'linear-gradient(150deg, #f6ecfb 0%, #efe6fb 50%, #fdeaf1 100%)',
            }}
          />
          <div className="grain absolute inset-0" />

          <div className="relative">
            <Pill tint="pink" className="bg-white/70">
              <Sparkle className="h-3 w-3" />
              Free to start
            </Pill>

            <h2 className="mx-auto mt-6 max-w-[15ch] font-display text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.03em] text-balance md:text-[3.4rem]">
              Your best skin starts with one{' '}
              <span className="marker">
                <span>scan</span>
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-md text-[1rem] leading-relaxed text-muted text-pretty">
              Ninety seconds today, a routine that keeps adapting for as long as you want it.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <StoreButton store="app" />
              <StoreButton store="play" />
            </div>

            <p className="mt-6 text-[0.82rem] text-faint">
              No card required · Cancel any time
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
