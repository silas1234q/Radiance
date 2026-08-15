import { skin1, skin2, skin3 } from '../assets/skins'
import { Plate, Pill } from './ui/Bits'
import { Sparkle } from './ui/Ink'
import Reveal from './ui/Reveal'

const testimonials = [
  {
    quote:
      'The analysis called out my barrier damage before I noticed it. Three weeks later the redness around my nose is just gone.',
    name: 'Sarah M.',
    meta: 'Combination · 8 weeks in',
    img: skin1,
    from: '#ffd9e6',
    to: '#e8a9c2',
    score: '+18',
  },
  {
    quote:
      'I have never kept a routine past a fortnight. The streaks got me to ninety days without it feeling like homework.',
    name: 'James L.',
    meta: 'Oily · 12 weeks in',
    img: skin2,
    from: '#dfe8ff',
    to: '#a9bcf0',
    score: '+22',
  },
  {
    quote:
      'Scanning a product before I buy it has saved me a small fortune. It flagged two alcohols my skin hates.',
    name: 'Priya K.',
    meta: 'Sensitive · 5 weeks in',
    img: skin3,
    from: '#e8ddff',
    to: '#bda8f0',
    score: '+11',
  },
]

export default function Testimonials() {
  return (
    <section id="stories" className="px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <Pill tint="lilac">
              <Sparkle className="h-3 w-3" color="#9C8CF0" />
              Real skin, real weeks
            </Pill>
            <h2 className="mt-5 max-w-[16ch] font-display text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] text-balance md:text-[3rem]">
              Skin that changed on{' '}
              <span className="marker">
                <span>their</span>
              </span>{' '}
              terms
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={80 * i}>
              <div
                className={`soft lift flex h-full flex-col p-6 ${
                  i === 1 ? 'md:-translate-y-5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Sparkle key={s} className="h-3 w-3" />
                    ))}
                  </div>
                  <span className="rounded-full bg-tint-mint px-2 py-0.5 text-[0.68rem] font-semibold text-mint">
                    {t.score} glow
                  </span>
                </div>

                <p className="mt-4 font-editorial text-[1.18rem] leading-[1.45] text-ink text-pretty">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="mt-auto flex items-center gap-3 pt-6">
                  <Plate
                    className="h-9 w-9 shrink-0 rounded-full"
                    src={t.img}
                    from={t.from}
                    to={t.to}
                  />
                  <div>
                    <p className="text-[0.85rem] font-semibold leading-tight">{t.name}</p>
                    <p className="text-[0.74rem] leading-tight text-faint">{t.meta}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
