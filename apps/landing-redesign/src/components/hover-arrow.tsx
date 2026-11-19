/**
 * A chevron that becomes an arrow when its button is hovered or keyboard-focused: the chevron head
 * slides toward where it points while a stem fades in behind it, meeting the head's tip. Reads the
 * shadcn Button's `group/button`, so it only works inside a Button.
 *
 * - "right" (default), for in-page CTAs: head spans x 1→5 at rest and 4→8 on hover (3px right);
 *   the stem runs x 0→7, ending just inside the tip.
 * - "up-right", for links that open elsewhere (the familiar ↗): a corner chevron at (7,3) moves
 *   2px up and 2px right to (9,1); the diagonal stem runs from (1,9) to (8,2), just inside the tip.
 * The stem is drawn the whole time but invisible at rest, so the icon's size never changes and the
 * label doesn't shift. Coordinates are in the 10×10 viewBox; px in the translate classes are those
 * units (SVG transforms use the SVG's own units).
 * Reduced motion: it still switches to the arrow, without the slide.
 * `className` sets the size (default size-2.5, for size sm buttons).
 */
const SHAPES = {
  right: {
    stem: "M0 5h7",
    head: "M1 1l4 4-4 4",
    move: "group-hover/button:translate-x-[3px] group-focus-visible/button:translate-x-[3px]",
  },
  "up-right": {
    stem: "M1 9L8 2",
    head: "M2 3h5v5",
    move: "group-hover/button:translate-x-[2px] group-hover/button:-translate-y-[2px] group-focus-visible/button:translate-x-[2px] group-focus-visible/button:-translate-y-[2px]",
  },
} as const

export function HoverArrow({
  className = "size-2.5",
  direction = "right",
}: {
  className?: string
  direction?: keyof typeof SHAPES
}) {
  const shape = SHAPES[direction]
  const motion = "transition-[translate,opacity] duration-200 ease-out motion-reduce:transition-none"
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`overflow-visible ${className}`}
    >
      <path
        d={shape.stem}
        className={`opacity-0 group-hover/button:opacity-100 group-focus-visible/button:opacity-100 ${motion}`}
      />
      <path d={shape.head} className={`${shape.move} ${motion}`} />
    </svg>
  )
}
