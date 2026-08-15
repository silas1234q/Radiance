import { useState } from 'react'
import { Link } from 'react-router'
import Logo from './ui/Logo'

// Ordered to match the order the sections appear on the home page, so the nav
// reads as a map of the page rather than an arbitrary list.
const navLinks = [
  { label: 'At a glance', href: '/#overview' },
  { label: 'Features', href: '/#features' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Stories', href: '/#stories' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-8 md:pt-6">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-hair bg-white/80 px-4 py-2.5 backdrop-blur-xl md:px-5">
        <Link to="/" className="flex items-center gap-1.5">
          <Logo className="h-8 w-8" />
          <span className="font-display text-[1.05rem] font-bold tracking-tight">Radiance</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-[0.85rem] font-medium text-muted transition-colors after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:text-ink hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/#get"
            className="hidden rounded-full bg-ink px-5 py-2.5 text-[0.82rem] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2c2a34] sm:inline-flex"
          >
            Try Radiance AI
          </a>

          <button
            onClick={() => setOpen(!open)}
            className="grid h-9 w-9 place-items-center rounded-full border border-hair text-ink md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl border border-hair bg-white/95 p-3 backdrop-blur-xl md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-[0.9rem] font-medium text-muted hover:bg-tint-pink hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/#get"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-full bg-ink px-5 py-3 text-center text-[0.88rem] font-semibold text-white"
          >
            Try Radiance AI
          </a>
        </div>
      )}
    </header>
  )
}
