import type { ReactNode } from "react"
import { GrainGradient } from "@paper-design/shaders-react"
import { Check, ChevronDown, Lock } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SectionHeading } from "./section-heading"
import { cn } from "@/lib/utils"

/**
 * BEFORE: "The product" section rebuilt from a screenshot of coinflow.cash (our own code,
 * not theirs), as the baseline to redesign from. The mockups are illustrations: no real
 * controls, one screen-reader description each.
 */
export function ProductSection() {
  return (
    <section aria-labelledby="product-heading" className="section-gap">
      <div className="page-container">
        <SectionHeading id="product-heading">
          Your customers pay how they want.
          <br />
          <span className="text-brand-blue">You get paid in T+5 seconds.</span>
        </SectionHeading>

        <div className="mt-14 grid gap-14 md:grid-cols-2">
          <Feature
            eyebrow="Pay-ins"
            text="Accept cards, digital wallets, and local bank rails through one integration."
          >
            <Panel glow={{ offsetX: -0.45, offsetY: 0.15 }}>
              <CheckoutMock />
            </Panel>
          </Feature>
          <Feature eyebrow="Payouts" text="Pay players, sellers, and collectors to bank or debit card.">
            <Panel glow={{ offsetX: 0.35, offsetY: -0.1 }}>
              <PayoutMock />
            </Panel>
          </Feature>
        </div>
      </div>
    </section>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-body text-xs font-semibold tracking-[0.14em] text-brand-blue uppercase">{children}</p>
}

function Feature({ eyebrow, text, children }: { eyebrow: string; text: string; children: ReactNode }) {
  return (
    <div>
      {children}
      <div className="mt-10">
        <Eyebrow>{eyebrow}</Eyebrow>
        <p className="mt-3 max-w-sm font-body text-xl text-pretty">{text}</p>
      </div>
    </div>
  )
}

/** Dark grain panel behind each mockup: the hero's shader, frozen, with the glow moved per panel. */
function Panel({ glow, children }: { glow: { offsetX: number; offsetY: number }; children: ReactNode }) {
  return (
    <div className="relative isolate flex aspect-[5/4] items-center justify-center overflow-hidden rounded-xl bg-[#141a2e] p-6">
      <GrainGradient
        aria-hidden
        className="absolute inset-0 -z-10"
        width="100%"
        height="100%"
        colors={["#2b5fd9", "#1d3f9a", "#141a2e"]}
        colorBack="#141a2e"
        softness={0.8}
        intensity={0.5}
        noise={0.45}
        shape="wave"
        // Still, like the reference; it only needs the texture, not the motion.
        speed={0}
        scale={1.2}
        offsetX={glow.offsetX}
        offsetY={glow.offsetY}
      />
      {children}
    </div>
  )
}

/** The white card the mockups sit on. */
function MockCard({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "w-full max-w-[18rem] rounded-xl bg-white p-4 font-body text-neutral-950 shadow-xl select-none",
        className,
      )}
    >
      {children}
    </div>
  )
}

function VisaMark() {
  return (
    <span className="inline-flex h-4 items-center rounded-[3px] bg-[#1a1f71] px-1 text-[8px] font-bold tracking-wide text-white italic">
      VISA
    </span>
  )
}

function CheckoutMock() {
  return (
    <MockCard label="Example checkout: pay Coffer & Co. $84.00 with Apple Pay, Google Pay, or a Visa card.">
      <p className="text-[11px] text-neutral-600">Pay Coffer &amp; Co.</p>
      <div className="mt-0.5 flex items-baseline justify-between">
        <span className="text-2xl font-medium tabular-nums">$84.00</span>
        <span className="flex items-center gap-0.5 text-xs text-neutral-600">
          Details <ChevronDown aria-hidden className="size-3" />
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-medium">
        <span className="flex h-9 items-center justify-center rounded-md bg-black text-white">Apple Pay</span>
        <span className="flex h-9 items-center justify-center rounded-md border border-neutral-200">Google Pay</span>
      </div>

      <div className="my-3 flex items-center gap-2 text-[11px] text-neutral-500">
        <Separator className="flex-1 bg-neutral-200" />
        or pay with card
        <Separator className="flex-1 bg-neutral-200" />
      </div>

      <div className="flex h-10 items-center gap-2 rounded-md border border-violet-500 px-2.5 text-sm">
        <VisaMark />
        <span className="tabular-nums">•••• 4242</span>
        <span className="ml-auto text-neutral-500 tabular-nums">12/28</span>
      </div>

      <span className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-md bg-violet-600 text-sm font-medium text-white">
        <Lock aria-hidden className="size-3.5" />
        Pay $84.00
      </span>
    </MockCard>
  )
}

function PayoutMock() {
  const rows: { label: string; value: ReactNode }[] = [
    { label: "To", value: "Maya Okafor" },
    {
      label: "Method",
      value: (
        <span className="flex items-center gap-1.5">
          <VisaMark /> Debit •••• 4242
        </span>
      ),
    },
    { label: "Speed", value: <span className="text-violet-600">Instant</span> },
  ]

  return (
    <MockCard label="Example payout: $1,248.00 sent instantly to Maya Okafor's Visa debit card ending 4242.">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-neutral-600">Payout</p>
          <p className="text-2xl font-medium tabular-nums">$1,248.00</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-200 px-3 py-1 text-xs font-medium">
          <Check aria-hidden className="size-3.5" /> Sent
        </span>
      </div>

      <dl className="mt-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-t border-neutral-200 py-2.5 text-sm">
            <dt className="text-xs text-neutral-600">{row.label}</dt>
            <dd className="tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="h-1 rounded-full bg-violet-600" />
    </MockCard>
  )
}
