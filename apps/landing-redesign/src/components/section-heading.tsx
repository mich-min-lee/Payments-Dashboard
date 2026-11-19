import type { ReactNode } from "react"

/**
 * Centered section heading in the primary font. Shared so every section's heading has the
 * same size, weight, and line spacing. leading-[1.2]: text-5xl defaults to a line-height of 1,
 * which crowds two-line headings.
 */
export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="text-center font-display text-4xl leading-[1.2] font-medium tracking-tight text-balance sm:text-5xl"
    >
      {children}
    </h2>
  )
}
