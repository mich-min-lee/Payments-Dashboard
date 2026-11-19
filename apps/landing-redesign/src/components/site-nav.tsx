import { ArrowRight, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { PRIMARY_CTA, capTrim, ctaMotion, navButton } from "../lib/cta"
import { HoverArrow } from "./hover-arrow"
import { NAV, isMenu, type NavMenu } from "../lib/nav-content"

/**
 * Top nav: a white bar with rounded bottom corners and a hairline border. Desktop menus open
 * as popovers (shadcn NavigationMenu: arrow keys, Escape, and hover all handled by Radix);
 * below `lg` everything moves into a sheet so the bar keeps one primary action.
 */
export function SiteNav() {
  return (
    // Fixed, so the bar floats over the hero (whose top padding leaves room for it) instead of
    // pushing it down; the strips beside the bar show the page underneath.
    <header className="fixed inset-x-0 top-0 z-50">
      {/* The bar itself sits on the page grid (not full-bleed), so it hangs from the top with
          visible rounded corners and lines up with the sections below at every breakpoint. */}
      <div className="page-container">
        {/* `relative z-0` stacks the glass layer below the content without making this bar a
            "backdrop root": an element with backdrop-filter stops blurs inside it (the menu popover)
            from seeing the page, so the bar's own blur lives on the layer below, not here. */}
        <div className="relative z-0 flex h-14 items-center justify-between gap-4 rounded-b-3xl border-x-[0.5px] border-b-[0.5px] border-border px-4 font-body">
          {/* Semi-transparent glass: 70% white over a blur of the page (90% where blur isn't supported). */}
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-b-3xl bg-background/90 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/70"
          />
          <div className="flex items-center gap-6 self-stretch">
            <a href="#" aria-label="Coinflow home" className="group/logo shrink-0 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              {/* Rests a touch lighter and goes to full strength on hover/focus, so it reads as darkening
                  (the logo is already near-black navy; darkening the fill itself would barely show).
                  width/height reserve the space before the SVG loads (1446×358 at 26px tall). */}
              <img
                src="/coinflow.svg"
                alt=""
                width={105}
                height={26}
                className="block h-[26px] w-auto opacity-80 transition-opacity duration-200 group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100"
              />
            </a>
            <DesktopMenu />
          </div>

          <div className="flex items-center gap-2">
            {/* navButton: same size and type as the primary next to it, so their hover backgrounds match.
                Hover: a faint brand-blue tint (10%, so the glass bar still shows through) and blue text,
                tying it to the blue primary beside it and the blue menu titles, instead of the ghost's
                opaque gray. Text is brand-blue-dark: plain brand blue measured 2.9:1 over the dark hero
                (the glass bar goes grayish there); the dark shade is 4.8:1 there and 9.4:1 over white. */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(navButton, "hidden hover:bg-brand-blue/10 hover:text-brand-blue-dark lg:inline-flex")}
            >
              <a href="#">
                <span className={capTrim}>Log in</span>
              </a>
            </Button>
            {/* Brand blue by re-pointing the token (same approach as the hero's .hero-surface), so the
                button keeps its shadcn `default` variant. White on brand blue is ~6.6:1.
                Hover: the fill darkens (no glow) and the chevron turns
                into an arrow (HoverArrow). ctaMotion keeps the press feel shared with the other CTAs. */}
            <Button
              asChild
              size="sm"
              className={cn(
                // Size and type from navButton (Stripe-style, shared with Log in). Height, not py, sets the
                // vertical room: shadcn buttons have a fixed height with the label centered.
                navButton,
                "[--primary-foreground:white] [--primary:var(--color-brand-blue)] hover:bg-brand-blue-dark",
                ctaMotion,
              )}
            >
              <a href={PRIMARY_CTA.href}>
                <span className={capTrim}>{PRIMARY_CTA.label}</span>
                <HoverArrow />
              </a>
            </Button>
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}

/** Shared by links and menu triggers: no pill, the label darkens on hover, focus, or while open.
 *  Menu triggers also animate their chevron (index.css). */
const NAV_ITEM =
  "inline-flex h-8 items-center rounded-full bg-transparent px-3 text-sm font-medium text-foreground/70 outline-none transition-colors hover:bg-transparent hover:text-foreground focus:bg-transparent focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-transparent data-[state=open]:text-foreground data-[state=open]:hover:bg-transparent"

function DesktopMenu() {
  return (
    // Full bar height, so the popover (top-full + 6px) opens below the bar instead of over it.
    <NavigationMenu className="hidden items-stretch self-stretch lg:flex">
      <NavigationMenuList className="h-full gap-1">
        {NAV.map((entry) =>
          isMenu(entry) ? (
            <NavigationMenuItem key={entry.label}>
              <NavigationMenuTrigger className={NAV_ITEM}>
                {entry.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <MenuPanel menu={entry} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={entry.label}>
              <NavigationMenuLink asChild>
                <a href={entry.href} className={NAV_ITEM}>
                  {entry.label}
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

/** Stripe-style columns: heading, rule, then title + short description per item. */
function MenuPanel({ menu }: { menu: NavMenu }) {
  return (
    <div className="font-body">
      <div
        className="grid gap-x-8 gap-y-6 p-4"
        style={{ gridTemplateColumns: `repeat(${menu.groups.length}, minmax(11rem, 1fr))` }}
      >
        {menu.groups.map((group) => (
          <section key={group.heading} aria-labelledby={headingId(menu, group.heading)} className="group/section">
            {/* When an item in this column is hovered or keyboard-focused (`has-[a:…]`, so hovering the
                heading itself doesn't count), a brand-blue line draws over the gray rule, left to right:
                scaleX from 0 with a left origin. Reduced motion: it appears without drawing. */}
            <h3
              id={headingId(menu, group.heading)}
              className="relative border-b pb-2 text-xs font-normal text-muted-foreground"
            >
              {group.heading}
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-brand-blue transition-[scale] duration-300 ease-out group-has-[a:focus-visible]/section:scale-x-100 group-has-[a:hover]/section:scale-x-100 motion-reduce:transition-none"
              />
            </h3>
            <ul className="mt-2 flex flex-col">
              {group.items.map((item) => (
                <li key={item.title}>
                  <NavigationMenuLink asChild>
                    {/* No card highlight (the shared link's hover/focus bg-muted is overridden). Titles are
                        brand blue and go darker on hover/focus; an arrow (currentColor, so it follows)
                        slides in after the title, left to right. Its space is always reserved
                        (opacity + translate, not display), so titles never shift. Keyboard focus shows
                        the arrow too, plus the shared focus ring. */}
                    <a
                      href={item.href}
                      className="group/menu-item -mx-2 flex flex-col items-start gap-0.5 px-2 py-2 hover:bg-transparent focus:bg-transparent"
                    >
                      <span className="flex items-center gap-1 text-sm font-medium text-brand-blue transition-colors duration-200 group-hover/menu-item:text-brand-blue-dark group-focus-visible/menu-item:text-brand-blue-dark">
                        {item.title}
                        <ArrowRight
                          aria-hidden
                          className="size-3.5 -translate-x-1.5 opacity-0 transition-[translate,opacity] duration-200 ease-out group-hover/menu-item:translate-x-0 group-hover/menu-item:opacity-100 group-focus-visible/menu-item:translate-x-0 group-focus-visible/menu-item:opacity-100 motion-reduce:translate-x-0 motion-reduce:transition-opacity"
                        />
                      </span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </a>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

const headingId = (menu: NavMenu, heading: string) =>
  `nav-${menu.label}-${heading}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto font-body">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col gap-6 px-4">
          {NAV.map((entry) =>
            isMenu(entry) ? (
              <section key={entry.label}>
                <h3 className="text-xs font-medium text-muted-foreground">{entry.label}</h3>
                <ul className="mt-1 flex flex-col">
                  {entry.groups.flatMap((group) =>
                    group.items.map((item) => (
                      <li key={`${group.heading}-${item.title}`}>
                        <a
                          href={item.href}
                          className="block rounded-md py-1.5 text-sm font-medium hover:text-muted-foreground"
                        >
                          {item.title}
                        </a>
                      </li>
                    )),
                  )}
                </ul>
              </section>
            ) : (
              <a key={entry.label} href={entry.href} className="text-sm font-medium">
                {entry.label}
              </a>
            ),
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-2 p-4">
          <Button asChild variant="outline">
            <a href="#">Log in</a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
