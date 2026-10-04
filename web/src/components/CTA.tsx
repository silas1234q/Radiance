import { Sparkle } from './ui/Ink'
import { Pill } from './ui/Bits'
import Reveal from './ui/Reveal'

/** iOS only for now — there's no Android build to link to yet. */
function AppStoreButton() {
  return (
    <a
      href="https://apps.apple.com/us/app/radiance-skin-care/id6794619381"
      className="inline-flex items-center gap-2.5 rounded-2xl bg-ink px-5 py-3 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2c2a34]"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
        <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.2 1.2-2.4 1.2-2.5-.1 0-2.4-.9-2.4-3.6ZM14.2 5.9c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.7-1.3Z" />
      </svg>
      <span className="text-left leading-none">
        <span className="block text-[0.6rem] text-white/60">Download on the</span>
        <span className="block text-[0.9rem] font-semibold">App Store</span>
      </span>
    </a>
  )
}

export default function CTA() {
  return (
    <section id="get" className="px-6 pb-20 pt-4 md:pb-24">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-4xl px-6 py-16 text-center md:py-20">
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

            <h2 className="mx-auto mt-6 max-w-[16ch] font-display text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.03em] text-balance md:text-[3.4rem]">
              Take the quiz, keep the{' '}
              <span className="marker">
                <span>routine</span>
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-md text-[1rem] leading-relaxed text-muted text-pretty">
              Ninety seconds of questions gives you a skin score and an AM/PM routine that explains
              every step. Add a face scan when you want a closer read.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <AppStoreButton />
            </div>

            <p className="mt-6 text-[0.82rem] text-faint">
              Cancel any time · iPhone today, Android coming soon
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
