import { GrainGradient } from "@paper-design/shaders-react"
import { Button } from "@/components/ui/button"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion"
import { cn } from "@/lib/utils"
import { PRIMARY_CTA, ctaMotion } from "../lib/cta"
import { COMPLIANCE_POINTS, SPEED_POINTS, type ProofPoint } from "../lib/proof-points"
import { HoverArrow } from "./hover-arrow"
import { WordRotator } from "./word-rotator"

const AUDIENCES = ["sellers", "creators", "merchants", "developers"] as const

// Placeholders: this is a local concept, not a live site.
const DOCS_URL = "#"

/**
 * Redesign in progress: started from Coinflow's current hero; the body copy and word rotator are new.
 * `dark` switches the shadcn tokens to their dark values for this section only;
 * `hero-surface` (index.css) makes the primary button white to match the reference.
 */
export function Hero() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    // bg matches the shader's colorBack, so there's no flash of a different color before WebGL paints.
    // Three tiers, grouped by proximity: message (tight), action (40px below), proof (anchored
    // to the bottom edge behind a hairline). pt-32 clears the fixed nav (~56px) with room to spare.
    // min-h-svh: the hero fills the first screen and the proof band lands on the fold, as the cue to
    // scroll. svh (not vh) so mobile browsers' collapsing toolbars don't make it jump.
    <section className="dark relative isolate flex min-h-svh flex-col overflow-hidden bg-[#00091f] pt-32 text-foreground">
      <GrainGradient
        aria-hidden
        className="absolute inset-0 -z-10"
        width="100%"
        height="100%"
        colors={["#0c56c6", "#63a4bf", "#2e317a"]}
        colorBack="#00091f"
        softness={0.7}
        intensity={0.58}
        noise={0.5}
        shape="wave"
        // Reduced motion: the gradient still renders, it just doesn't move.
        speed={reducedMotion ? 0 : 1.5}
        scale={1.04}
        rotation={0}
        offsetX={-0.06}
        offsetY={0.5}
      />

      <div className="hero-surface flex flex-1 flex-col items-center justify-center px-4 pb-20 text-center">
        {/* 1. Message: headline and subtitle, tight together. */}
        <h1 className="max-w-5xl font-display text-5xl font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl">
          {/* "internet speed." in a true serif italic: the contrast with the sans is the accent.
              Instrument Serif runs small next to the sans, so 1.1em to match; font-normal + no
              synthesis because it has no bold to fake. Normal tracking: tight tracking crowds a serif.

              Static on purpose: slide-ins and letter ripples read as playful for financial
              infrastructure; the serif italic carries the emphasis on its own. */}
          Payments at{" "}
          <span className="font-accent text-[1.1em] font-normal tracking-normal italic [font-synthesis:none]">
            internet speed.
          </span>
        </h1>

        <p className="mt-5 max-w-[50rem] font-body text-lg leading-relaxed font-light text-foreground/90">
          Financial infrastructure to accept pay-ins, settle funds, and pay out to{" "}
          {/* Screen readers get one full sentence; the rotator is visual only. */}
          <span className="sr-only">sellers, creators, merchants, and developers.</span>
          {/* 1.6s per word: brisk, but long enough to read a word before it slides away. */}
          <WordRotator
            words={AUDIENCES}
            interval={1600}
            animate={!reducedMotion}
            className="font-mono font-semibold text-mint"
          />
        </p>

        {/* 2. Action, 40px below the message.
            Taller than shadcn's lg (40px), so h-12 + px-6.
            Primary: same behavior as the nav CTA, in white (hero-surface): regular weight (400), no glow,
            and the chevron turns into an arrow.
            Cut-out label: the button blends with `screen`, where white stays white and black turns fully
            see-through, so pure-black text (and the arrow, which is currentColor) becomes a window onto
            the shader. Works because the hero section is `isolate`, so the blend reaches the shader canvas.
            Hover tints the fill 15% toward black; under screen that reads as the white going slightly
            glassy (the shader faintly shows through) rather than gray.
            Legibility varies with the shader behind the label: 6.6–19.8:1 over its navy/indigo/blue,
            2.8:1 over the light-blue wave. */}
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Button
            asChild
            size="lg"
            className={cn(
              "h-12 gap-2.5 px-6 text-base font-normal text-black mix-blend-screen hover:bg-[color-mix(in_oklab,var(--primary)_85%,black)]",
              ctaMotion,
            )}
          >
            <a href={PRIMARY_CTA.href}>
              {PRIMARY_CTA.label}
              <HoverArrow className="size-3" />
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className={cn("h-12 gap-2.5 px-6 text-base font-normal", ctaMotion)}
          >
            {/* Same chevron-to-arrow as the primary, pointing up-right: the usual "opens elsewhere" sign. */}
            <a href={DOCS_URL} target="_blank" rel="noreferrer">
              Read the docs
              <HoverArrow className="size-3" direction="up-right" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        </div>
      </div>

      {/* 3. Proof: a band on the hero's bottom edge, so it supports the CTAs instead of competing
          with them. The hairline also hints that the page continues below. */}
      {/* Legibility: the shader keeps moving, so the band gets its own backing. Worst case (the light-blue
          wave behind it) blends to ~rgb(30,55,79); white at 90% on that is ~11:1, well past AA. */}
      <div className="border-t border-foreground/10 bg-[#00091f]/70 backdrop-blur-md">
        {/* Hover spotlight (see ProofList): `group/proof` lets every point know when any point is hovered. */}
        <div className="group/proof page-container flex flex-col items-center gap-3 py-6 font-body text-body text-foreground/90 sm:flex-row sm:justify-center sm:gap-6">
          <ProofList label="Speed" points={SPEED_POINTS} />
          <span aria-hidden className="hidden h-4 w-px bg-foreground/20 sm:block" />
          <ProofList label="Compliance" points={COMPLIANCE_POINTS} />
        </div>
      </div>
    </section>
  )
}

/**
 * Hover spotlight: the hovered point goes full white and its icon pops (a springy scale + tilt);
 * the other points dim, so attention lands on one claim at a time. These aren't links, so nothing
 * suggests a click: default cursor, no underline, no background. Dimmed to 65%: on the band's
 * worst-case backing (~rgb(30,55,79)) that's 5.1:1, past AA's 4.5:1 (55% measured 4.2:1). Reduced motion: the spotlight stays, the pop doesn't.
 */
function ProofList({ label, points }: { label: string; points: readonly ProofPoint[] }) {
  return (
    <ul aria-label={label} className="flex flex-wrap justify-center gap-x-5 gap-y-2">
      {points.map(({ label: text, icon: Icon }) => (
        <li
          key={text}
          className="group/point flex items-center gap-1.5 transition-[opacity,color] duration-300 ease-out group-has-[li:hover]/proof:opacity-65 hover:text-foreground group-has-[li:hover]/proof:hover:opacity-100"
        >
          <Icon
            aria-hidden
            className="size-4 text-mint transition-[scale,rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/point:scale-125 group-hover/point:-rotate-12 motion-reduce:transition-none motion-reduce:group-hover/point:scale-100 motion-reduce:group-hover/point:rotate-0"
          />
          {text}
        </li>
      ))}
    </ul>
  )
}
