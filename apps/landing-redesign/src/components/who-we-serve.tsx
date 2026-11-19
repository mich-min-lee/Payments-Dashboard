import { useState, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useHoverIntent } from "../hooks/use-hover-intent";
import { SectionHeading } from "./section-heading";

interface Industry {
  value: string;
  title: string;
  /** One sentence per line in the open card. */
  lines: readonly string[];
  /** Short name screen readers hear after "Explore", so the eight links don't all sound the same. */
  linkLabel: string;
  href: string;
  /** The row's gradient: a glow color over a dark base, in the spirit of the reference's strips. */
  glow: string;
  base: string;
}

// Titles, descriptions, and links from coinflow.cash's "Who we serve" section (Nov 2026).
// Colors approximate the reference; the layout and code are ours.
const SITE = "https://coinflow.cash/use-cases";
const INDUSTRIES: readonly Industry[] = [
  {
    value: "payroll",
    title: "Cross-border payroll",
    lines: ["Work crosses borders in a click.", "Pay should too."],
    linkLabel: "cross-border payroll",
    href: `${SITE}/payroll`,
    glow: "#1d3a7a",
    base: "#0b1430",
  },
  {
    value: "ecommerce",
    title: "E-commerce",
    lines: ["Your growth moves fast.", "Your payments should keep up."],
    linkLabel: "e-commerce",
    href: `${SITE}/ecommerce`,
    glow: "#2f6b4a",
    base: "#0b1a14",
  },
  {
    value: "fintech",
    title: "Fintech",
    lines: ["Payout speed is your competitive advantage."],
    linkLabel: "fintech",
    href: `${SITE}/fintech`,
    glow: "#7b3a9a",
    base: "#1a0f2a",
  },
  {
    value: "gaming",
    title: "Gaming",
    lines: ["Players pay.", "Winners get paid in seconds."],
    linkLabel: "gaming",
    href: `${SITE}/gaming`,
    glow: "#5a35b0",
    base: "#0f0b2a",
  },
  {
    value: "marketplaces",
    title: "Marketplaces",
    lines: ["Buyers buy.", "Sellers get paid fast."],
    linkLabel: "marketplaces",
    href: `${SITE}/marketplaces`,
    glow: "#2a6b78",
    base: "#0a1a20",
  },
  {
    value: "remittances",
    title: "Remittances",
    lines: ["Users send money to their families in seconds."],
    linkLabel: "remittances",
    href: `${SITE}/remittances`,
    glow: "#7a2a3e",
    base: "#1a0b12",
  },
  {
    value: "ticketing",
    title: "Ticketing & live events",
    lines: ["Sellers list where they get paid first."],
    linkLabel: "ticketing",
    href: `${SITE}/ticketing`,
    glow: "#8a4a1e",
    base: "#1a0e08",
  },
  {
    value: "travel",
    title: "Travel & hospitality",
    lines: ["Accept payments from guests.", "Pay out to partners."],
    linkLabel: "travel",
    href: `${SITE}/travel`,
    glow: "#2d5f8a",
    base: "#0b1626",
  },
];

/** Two columns of four, read top to bottom: the first half of the list, then the second. */
const half = Math.ceil(INDUSTRIES.length / 2);
const COLUMNS = [INDUSTRIES.slice(0, half), INDUSTRIES.slice(half)] as const;

/** A soft glow in the top-right corner over a dark top-to-bottom fade. */
const gradient = ({ glow, base }: Industry): CSSProperties => ({
  backgroundImage: `radial-gradient(120% 160% at 90% 0%, ${glow} 0%, transparent 60%), linear-gradient(180deg, ${glow}66, ${base})`,
  backgroundColor: base,
});

/**
 * The reference is a horizontal accordion with sideways labels. Vertical here, so every label
 * reads left to right. Opens on hover (mouse), click, tap, or keyboard.
 *
 * Hover opens a row when the mouse slows down or stops on it, not while it sweeps across
 * (useHoverIntent), so a fast pass over the list doesn't open, and interrupt, row after row.
 */
export function WhoWeServe() {
  const [open, setOpen] = useState("gaming");
  const hover = useHoverIntent(setOpen);

  return (
    <section aria-labelledby="who-we-serve-heading" className="section-gap">
      <div className="page-container">
        <SectionHeading id="who-we-serve-heading">
          Built for platforms that
          <br />
          <span className="text-brand-blue">move money both ways.</span>
        </SectionHeading>

        {/* Two columns from lg (each column is too narrow for the card text below that; it stacks
            into one list). Each column is its own Accordion, so opening a card only grows its own
            column; a single grid would grow the whole row and leave a gap beside the open card.
            Both columns share one controlled value, so one industry is open across the section
            (`v &&` ignores Radix's "" when the open row is clicked again). A column whose items
            don't include the value simply shows all closed. `dark`: shadcn tokens switch to their
            dark values on these dark rows. Radix gives aria-expanded, regions, and arrow-key
            navigation (within a column; Tab moves between columns). */}
        <div className="dark mx-auto mt-14 grid max-w-6xl gap-2 lg:grid-cols-2 lg:items-start">
          {COLUMNS.map((column, c) => (
            <Accordion
              key={c}
              type="single"
              value={open}
              onValueChange={(v) => v && setOpen(v)}
              onPointerLeave={hover.onPointerLeave}
              className="gap-2"
            >
              {column.map((industry) => (
                <AccordionItem
                  key={industry.value}
                  value={industry.value}
                  style={gradient(industry)}
                  onPointerMove={(event) => hover.onPointerMove(event, industry.value)}
                  className="relative isolate overflow-hidden rounded-2xl text-foreground transition-[filter] not-last:border-b-0 hover:brightness-110 motion-reduce:transition-none"
                >
                  {/* Grain: gray noise at low opacity, normal blend. (Overlay blending, tried first,
                      vanishes on near-black: it darkens darks.) */}
                  <span
                    aria-hidden
                    className="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
                  />
                  <AccordionTrigger className="items-center rounded-2xl px-6 py-5 font-display text-lg font-medium hover:no-underline **:data-[slot=accordion-trigger-icon]:text-foreground/70">
                    {industry.title}
                  </AccordionTrigger>
                  {/* `h-auto`: the shadcn content locks its inner height to the height Radix measured
                      last time, and Radix measures that same element, so a card could never grow after
                      its first open (Explore got clipped when the text got taller or reflowed). */}
                  <AccordionContent className="h-auto px-6 pt-16 pb-6 [&_a]:no-underline">
                    {/* Settles in 340ms while the row takes 600ms, so the text is in place before the
                        row finishes opening (the reference's caption does the same). */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 ease-out [--tw-animation-duration:340ms] motion-reduce:animate-none">
                      {/* Always two lines tall (`2lh` = two of its own line heights), so Explore sits in
                          the same place on one-sentence cards and every open card is the same height. */}
                      <p className="min-h-[2lh] font-display text-2xl leading-tight font-medium sm:text-3xl">
                        {industry.lines.map((line, i) => (
                          <span key={line}>
                            {i > 0 && <br />}
                            {line}
                          </span>
                        ))}
                      </p>
                      <a
                        href={industry.href}
                        className="group/explore mt-6 inline-flex items-center gap-1 rounded-sm font-body text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        Explore<span className="sr-only"> {industry.linkLabel}</span>
                        <ArrowRight
                          aria-hidden
                          className="size-4 transition-transform group-hover/explore:translate-x-0.5 motion-reduce:transition-none"
                        />
                      </a>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ))}
        </div>
      </div>
    </section>
  );
}
