import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * An inline word that slides up to the next one every few seconds, or on click.
 *
 * Visual only (`aria-hidden`, out of the tab order): the parent must put the full list in
 * screen-reader text. Clicking is a mouse bonus, so keyboard users lose nothing.
 * Hovering pauses it. Reduced motion: no auto-rotate and no slide; a click still swaps the word.
 */
export function WordRotator({
  words,
  interval = 2500,
  animate,
  className,
}: {
  words: readonly string[]
  interval?: number
  animate: boolean
  className?: string
}) {
  // `previous` is the word sliding out; it's removed when its exit animation ends.
  const [{ index, previous }, setState] = useState<{ index: number; previous: number | null }>({
    index: 0,
    previous: null,
  })
  const [paused, setPaused] = useState(false)

  const next = useCallback(
    () => setState((s) => ({ index: (s.index + 1) % words.length, previous: animate ? s.index : null })),
    [words.length, animate],
  )

  // Restarts on every word change, so a click also resets the countdown.
  useEffect(() => {
    if (!animate || paused) return
    const id = window.setTimeout(next, interval)
    return () => window.clearTimeout(id)
  }, [index, animate, paused, interval, next])

  return (
    <button
      type="button"
      aria-hidden
      tabIndex={-1}
      title="Next"
      onClick={next}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        // Every child shares one grid cell ([grid-area:1/1]), so they stack on top of each other.
        // Baseline-aligned like the words around it. Clipped with clip-path, not overflow-hidden:
        // overflow-hidden would make the browser align the box's bottom edge instead of the text.
        "relative inline-grid cursor-pointer text-left align-baseline whitespace-nowrap [clip-path:inset(0)]",
        className,
      )}
    >
      {/* Invisible copies of every word size the cell to the longest one, so the box never
          changes width and the rest of the line stays put. Pure CSS, no measuring. */}
      {words.map((word) => (
        <span key={`size-${word}`} className="invisible [grid-area:1/1]">
          {word}
        </span>
      ))}
      {previous !== null && (
        <span
          key={`out-${previous}`}
          className="animate-out duration-300 fill-mode-forwards fade-out-0 slide-out-to-top-[100%] [grid-area:1/1]"
          onAnimationEnd={() => setState((s) => ({ ...s, previous: null }))}
        >
          {words[previous]}
        </span>
      )}
      <span
        key={index}
        className={cn(
          "[grid-area:1/1]",
          previous !== null && "animate-in duration-300 fade-in-0 slide-in-from-bottom-[100%]",
        )}
      >
        {words[index]}
      </span>
    </button>
  )
}
