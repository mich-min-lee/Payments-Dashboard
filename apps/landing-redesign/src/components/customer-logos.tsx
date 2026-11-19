import { useInView } from "../hooks/use-in-view"

type Customer = {
  name: string
  logoSrc: string
  /** Logos have different optical weights, so each one gets its own height (px) to look the same size. */
  logoHeight: number
}

// Names, logos, and heights copied from the live coinflow.cash homepage (user-approved for this local concept).
const CUSTOMERS: readonly Customer[] = [
  { name: "Triumph", logoSrc: "/images/customers/triumph.png", logoHeight: 18 },
  { name: "Novig", logoSrc: "/images/customers/novig.svg", logoHeight: 21 },
  { name: "Félix", logoSrc: "/images/customers/f-lix.svg", logoHeight: 22 },
  { name: "Whop", logoSrc: "/images/customers/whop.svg", logoHeight: 19 },
  { name: "Crowncards", logoSrc: "/images/customers/crowncards.webp", logoHeight: 17 },
  { name: "Courtside", logoSrc: "/images/customers/courtside.svg", logoHeight: 20 },
  { name: "Tradepost", logoSrc: "/images/customers/tradepost.svg", logoHeight: 22 },
  { name: "Riker", logoSrc: "/images/customers/riker.png", logoHeight: 18 },
  { name: "PackDraw", logoSrc: "/images/customers/packdraw.png", logoHeight: 22 },
  { name: "Courtyard", logoSrc: "/images/customers/courtyard.svg", logoHeight: 24 },
  { name: "XP", logoSrc: "/images/customers/xp.webp", logoHeight: 20 },
  { name: "Icybox", logoSrc: "/images/customers/icybox.svg", logoHeight: 17 },
]

/**
 * Customer logo wall, matching coinflow.cash's `.fb-logos` section. Hairlines come from a 1px
 * grid gap over a tinted background, so inner lines stay 1px at any column count.
 * Their breakpoint is 760px (2 columns at or below, 6 above), hence `min-[761px]`.
 */
export function CustomerLogos() {
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <section
      aria-labelledby="customers-label"
      className="mx-auto max-w-[1200px] section-gap px-6 font-body"
    >
      {/* Slow reveal on scroll: fades in and rises 16px over 1s. `motion-safe` means reduced-motion
          users never get the hidden state, so the logos are simply there. */}
      <div
        ref={ref}
        className={`motion-safe:transition motion-safe:duration-1000 motion-safe:ease-out ${
          inView ? "" : "motion-safe:translate-y-4 motion-safe:opacity-0"
        }`}
      >
        <p
          id="customers-label"
          className="mb-3.5 text-center text-[11px] font-semibold tracking-[0.18em] text-[#131416]/50 uppercase"
        >
          Powering
        </p>

        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#131416]/10 bg-[#131416]/10 min-[761px]:grid-cols-6">
          {CUSTOMERS.map((customer) => (
            <li key={customer.name} className="flex h-[72px] items-center justify-center bg-white px-5 min-[761px]:h-24">
              {/* brightness-0 turns every logo solid black so mixed brand colors read as one set. */}
              <img
                src={customer.logoSrc}
                alt={customer.name}
                style={{ height: customer.logoHeight }}
                className="w-auto max-w-full scale-85 opacity-72 brightness-0 min-[761px]:scale-100"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
