/**
 * The primary call to action. One definition, so the nav and hero always say the same thing
 * and go to the same place. Placeholder link: this is a local concept, not a live site.
 */
export const PRIMARY_CTA = { label: "Grow with Coinflow", href: "#" } as const

/**
 * How every CTA reacts to hover and press. Passed as `className` on the shadcn Button; its class
 * merge replaces the conflicting defaults (`transition-all`, 150ms both ways) with these.
 * - Only the properties that change are animated. Tailwind v4's translate/scale are their own
 *   CSS properties (not `transform`), so they're listed by name.
 * - Press is quick (100ms) so taps feel acknowledged; release eases back slower (200ms).
 * - Reduced motion: colors still change, nothing moves or scales.
 */
export const ctaMotion =
  "transition-[translate,scale,background-color,box-shadow] duration-200 ease-out active:scale-[0.98] active:duration-100 motion-reduce:transition-colors motion-reduce:active:scale-100"

/**
 * Nav bar button shape and type, after Stripe's: 40px tall, 20px sides, 4px radius, regular weight,
 * line-height 1, no tracking, 8px label-to-icon gap. Shared by "Log in" and the primary so they match.
 * (Stripe's 18px label is from a full-width mobile button; 15px suits the desktop bar's 14px links.)
 */
export const navButton = "h-10 gap-2 rounded-[4px] px-5 text-[15px] leading-none font-normal tracking-normal"

/**
 * Trims the label's box to its cap height (text-box), so the capitals sit exactly centered in the
 * button instead of riding high or low on the font's built-in line spacing. Goes on a span around
 * the label: text-box isn't inherited, so on the button itself it wouldn't reach the text.
 * Browsers without text-box support just keep the normal box.
 */
export const capTrim = "[text-box:trim-both_cap_alphabetic]"
