import { useEffect, useRef, type PointerEvent } from "react"

/** Below this speed the cursor is aiming at something, not passing through: 0.4px/ms = 400px/s. */
const AIMING_SPEED = 0.4
/** No movement for this long means the cursor has stopped. Moving, pointer events arrive every ~8–16ms. */
const STOP_DELAY = 80
/** Floor for the time between two events, so two events a millisecond apart don't read as a huge speed. */
const MIN_INTERVAL = 8

interface Sample {
  x: number
  y: number
  t: number
}

/**
 * Hover intent by speed: calls `onIntent(target)` when the mouse slows down over a target (at once)
 * or stops on it (after STOP_DELAY), and never while it sweeps across. Only movement counts, so a
 * target that slides under a still cursor (as rows shift) isn't picked. Touch and pen are ignored;
 * they open on tap.
 *
 * Put `onPointerMove` on each target and `onPointerLeave` on their shared container, so speed is
 * measured continuously across targets and starts fresh on re-entry. `onIntent` should be stable
 * (a state setter is), because a pending stop timer calls the one it was given.
 */
export function useHoverIntent(onIntent: (target: string) => void) {
  const last = useRef<Sample | null>(null)
  const stopTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(stopTimer.current), [])

  const onPointerMove = (event: PointerEvent<HTMLElement>, target: string) => {
    if (event.pointerType !== "mouse") return
    window.clearTimeout(stopTimer.current)

    const now = { x: event.clientX, y: event.clientY, t: event.timeStamp }
    const prev = last.current
    last.current = now
    // No previous sample (just entered): speed unknown, so treat it as fast and wait for the next.
    const speed = prev
      ? Math.hypot(now.x - prev.x, now.y - prev.y) / Math.max(now.t - prev.t, MIN_INTERVAL)
      : Infinity

    if (speed < AIMING_SPEED) onIntent(target)
    else stopTimer.current = window.setTimeout(() => onIntent(target), STOP_DELAY)
  }

  const onPointerLeave = () => {
    window.clearTimeout(stopTimer.current)
    last.current = null
  }

  return { onPointerMove, onPointerLeave }
}
