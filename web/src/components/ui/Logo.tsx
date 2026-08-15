import logoSrc from '../../assets/logo-128.png'

/**
 * Brand mark — the app icon, a white droplet on a pink rounded square.
 *
 * Sourced from `logo-128.png`, not the 1024px `logo.png` master: this renders
 * at 32–36px, and the master is 1.26MB, which is an absurd download for a mark
 * that size. 128px still covers a 3x display.
 *
 * The artwork carries its own transparent margin — the opaque icon spans only
 * the middle ~62%, with a soft pink glow fading out to the edges. So the
 * droplet always reads smaller than the box you size here, and the box wants
 * slightly less gap to a wordmark than a bare glyph would.
 *
 * `alt` is empty wherever this sits beside the word "Radiance" — the name is
 * already there as text, and repeating it would just make screen readers say it
 * twice. Pass `label` on the rare standalone use.
 */
export default function Logo({
  className = 'h-7 w-7',
  label = '',
}: {
  className?: string
  label?: string
}) {
  return (
    <img
      src={logoSrc}
      alt={label}
      width={128}
      height={128}
      decoding="async"
      className={`shrink-0 object-contain ${className}`}
    />
  )
}
