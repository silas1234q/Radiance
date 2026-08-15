import { Link } from 'react-router'
import { usePageMeta } from '../lib/usePageMeta'

export default function NotFound() {
  usePageMeta('Page not found', 'That page does not exist.')

  return (
    <section className="relative grid place-items-center px-6 py-32">
      <div className="mx-auto max-w-lg text-center">
        <p className="font-display text-[3.5rem] font-semibold leading-none tracking-[-0.03em] text-primary">
          404
        </p>
        <h1 className="mt-4 font-display text-[1.8rem] font-semibold tracking-[-0.02em] text-balance">
          We could not find that page
        </h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-muted text-pretty">
          The link may be out of date, or the page may have moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-[0.88rem] font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary"
        >
          Back to home
        </Link>
      </div>
    </section>
  )
}
