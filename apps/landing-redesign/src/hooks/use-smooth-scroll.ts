import Lenis from "lenis"
import { useEffect } from "react"
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion"

/**
 * Slow, eased page scroll (Lenis) for the whole site. Two knobs set the feel:
 * - lerp: how much of the remaining distance the page covers each frame. Lower = floatier glide.
 * - wheelMultiplier: how far one wheel tick moves the page. Lower = slower overall.
 * Touch keeps the phone's native scroll; reduced-motion users get the browser's normal scroll.
 */
export function useSmoothScroll() {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const lenis = new Lenis({
      lerp: 0.1, // Lenis default; lower = floatier, higher = snappier
      wheelMultiplier: 1, // normal distance per wheel tick; lower = slower
      anchors: true, // in-page #links glide too, instead of jumping
      autoRaf: true, // Lenis runs its own animation-frame loop
    })
    return () => lenis.destroy()
  }, [reducedMotion])
}
