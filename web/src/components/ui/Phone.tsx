import type { ReactNode } from 'react'
import scanResult from '../../assets/scanned result img.png'
import analysisScreen from '../../assets/analysis screen.jpeg'

/**
 * Device shell. The screen is a plain slot so each section can drop a
 * different piece of the Radiance app into it.
 */
export function PhoneFrame({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative rounded-[2.6rem] bg-[#1b1a20] p-[0.42rem] shadow-[0_38px_70px_-24px_rgb(46_24_60/0.55),0_0_0_1px_rgb(255_255_255/0.08)_inset] ${className}`}
    >
      {/* side buttons */}
      <span className="absolute -left-[2px] top-[22%] h-9 w-[3px] rounded-l-full bg-[#2e2c36]" />
      <span className="absolute -left-[2px] top-[34%] h-14 w-[3px] rounded-l-full bg-[#2e2c36]" />
      <span className="absolute -right-[2px] top-[28%] h-16 w-[3px] rounded-r-full bg-[#2e2c36]" />

      <div className="relative overflow-hidden rounded-[2.25rem] bg-white">
        {/* dynamic island */}
        <div className="absolute left-1/2 top-2 z-20 h-[1.15rem] w-[4.6rem] -translate-x-1/2 rounded-full bg-[#1b1a20]" />
        {children}
      </div>
    </div>
  )
}

/**
 * Real analysis-result screenshot, used where we want the actual product rather
 * than a drawn approximation.
 *
 * The aspect ratio is the image's own (852×1846) so nothing is cropped, and no
 * status bar is drawn. The capture originally carried a real iOS status bar
 * (clock pill, LTE, battery); it has been painted out of the asset — rows 0-71,
 * backfilled by extending the backdrop's gradient upward, which is why nothing
 * below shifted. That leaves the strip empty for the frame's dynamic island,
 * which is where a real device would put it.
 *
 * Rendered twice (hero, and the scan step of How It Works). It's the same URL,
 * so the second instance costs no extra request.
 */
export function ScanResultShot() {
  return (
    <div className="relative aspect-[852/1846] w-full overflow-hidden bg-[#17161c]">
      <img
        src={scanResult}
        alt="Radiance analysis results: a skin score of 92 with hydration, oil balance and even-tone readings."
        // Above the fold in the hero, so it must not be lazy — it's the largest
        // element the page paints.
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  )
}

/**
 * Real Analysis-tab screenshot — glow level and XP, skin health score, and the
 * score-over-time chart.
 *
 * Same treatment as `ScanResultShot`: the image's own aspect ratio (591×1280)
 * so nothing crops, and no drawn status bar, because the capture already has
 * one. Unlike the hero shot this is always below the fold, so it stays lazy.
 */
export function AnalysisShot() {
  return (
    <div className="relative aspect-[591/1280] w-full overflow-hidden bg-page">
      <img
        src={analysisScreen}
        alt="Radiance analysis screen: a skin health score of 72, a glow level of Seedling, and a chart of skin score over time."
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  )
}
