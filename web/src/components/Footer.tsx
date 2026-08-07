import { Sparkle } from './ui/Ink'

const footerLinks = [
  { heading: 'Product', links: ['Face scan', 'Routines', 'Product scanner', 'Pricing'] },
  { heading: 'Company', links: ['About', 'Journal', 'Careers', 'Press'] },
  { heading: 'Support', links: ['Help centre', 'Contact', 'Privacy', 'Terms'] },
]

const socials = [
  {
    label: 'Instagram',
    path: 'M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.8-7.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21 8.9c0-1.9-.5-3.5-1.8-4.8S16.3 2.3 14.4 2.2c-1.9-.1-7 0-8.9.1S2.5 3.1 1.2 4.4 0 7.5 0 9.4v5.2c.1 1.9.5 3.5 1.8 4.8s2.9 1.8 4.8 1.8h9.2c1.9 0 3.5-.5 4.8-1.8s1.8-2.9 1.8-4.8V8.9Z',
    viewBox: '0 0 22 24',
  },
  {
    label: 'TikTok',
    path: 'M16.6 5.8a4.8 4.8 0 0 1-1.1-3.1h-3.4v13.6a2.9 2.9 0 1 1-2.1-2.8V10a6.3 6.3 0 1 0 5.5 6.3V9.4a8.2 8.2 0 0 0 4.8 1.5V7.5a4.8 4.8 0 0 1-3.7-1.7Z',
    viewBox: '0 0 24 24',
  },
  {
    label: 'X',
    path: 'M17.2 3h3.3l-7.2 8.2L21.8 21h-6.6l-5.2-6.7L4.1 21H.8l7.7-8.8L.5 3h6.8l4.7 6.2L17.2 3Zm-1.2 16h1.8L6.1 4.8H4.2L16 19Z',
    viewBox: '0 0 22 24',
  },
]

export default function Footer() {
  return (
    <footer className="relative px-6 pb-10">
      <div className="mx-auto max-w-6xl border-t border-hair pt-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <a href="/" className="flex items-center gap-2">
              <Sparkle className="h-4 w-4" />
              <span className="font-display text-[1.15rem] font-bold tracking-tight">Radiance</span>
            </a>
            <p className="mt-3 max-w-[28ch] text-[0.88rem] leading-relaxed text-muted">
              AI skincare that reads your skin, not the trend cycle.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-hair bg-white text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                >
                  <svg viewBox={s.viewBox} className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-faint">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[0.88rem] text-muted transition-colors hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-hair pt-6 sm:flex-row">
          <p className="text-[0.8rem] text-faint">
            &copy; {new Date().getFullYear()} Radiance. All rights reserved.
          </p>
          <p className="font-editorial text-[0.95rem] italic text-faint">Scan. Understand. Glow.</p>
        </div>
      </div>
    </footer>
  )
}
