import { CustomerLogos } from "./components/customer-logos"
import { Hero } from "./components/hero"
import { ProductSection } from "./components/product-section"
import { SiteNav } from "./components/site-nav"
import { WhoWeServe } from "./components/who-we-serve"
import { useSmoothScroll } from "./hooks/use-smooth-scroll"

export default function App() {
  useSmoothScroll()

  return (
    <>
      <SiteNav />
      {/* Page-end padding: the last section is light and only pads its top (section-gap), so
          without this its content would sit flush against the bottom of the page. */}
      <main className="pb-(--section-gap)">
        <Hero />
        <CustomerLogos />
        <WhoWeServe />
        <ProductSection />
      </main>
    </>
  )
}
