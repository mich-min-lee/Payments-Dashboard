/**
 * Nav menu content. Every claim comes from coinflow.cash, docs.coinflow.cash, or the
 * Coinflow blog (read Nov 2026); links point to the page the claim came from.
 * "#" = no public page found. Descriptions stay short and use industry terms (see CLAUDE.md).
 */

export interface NavMenuItem {
  title: string
  description: string
  href: string
}

export interface NavMenuGroup {
  heading: string
  items: NavMenuItem[]
}

export interface NavMenu {
  label: string
  groups: NavMenuGroup[]
}

export type NavEntry = NavMenu | { label: string; href: string }

export const isMenu = (entry: NavEntry): entry is NavMenu => "groups" in entry

const DOCS = "https://docs.coinflow.cash/guides"
const BLOG = "https://coinflow.cash/blog"

// Columns follow the money: in → moving → spent → managed, matching the hero sentence.
const PRODUCTS: NavMenu = {
  label: "Products",
  groups: [
    {
      heading: "Acceptance",
      items: [
        {
          title: "Checkout",
          description: "Hosted, embedded SDK, or API",
          href: `${DOCS}/checkout/checkout-overview/how-checkout-works`,
        },
        {
          title: "Pay-ins",
          description: "Cards, wallets, ACH, SEPA, PIX",
          href: `${DOCS}/checkout/payment-methods/supported-countries`,
        },
        {
          title: "Subscriptions",
          description: "Recurring billing on cards and ACH",
          href: `${DOCS}/subscriptions/subscriptions-overview`,
        },
      ],
    },
    {
      heading: "Money movement",
      items: [
        {
          title: "Payouts",
          description: "RTP, push-to-card, SEPA Instant, PIX",
          href: `${DOCS}/payouts/payout-overview`,
        },
        {
          title: "Marketplaces",
          description: "Seller KYB, split payments, payouts",
          href: `${DOCS}/marketplaces/marketplace-overview`,
        },
        { title: "FX", description: "Payouts in local currency", href: "#" },
      ],
    },
    {
      heading: "Spend",
      items: [
        { title: "Coinflow Spend", description: "Visa cards funded by your balance", href: `${BLOG}/coinflow-spend` },
      ],
    },
    {
      heading: "Risk & operations",
      items: [
        {
          title: "Chargeback Protection",
          description: "AI scoring with chargeback coverage",
          href: `${DOCS}/checkout/payment-security-risk-management/fraud-protection/about-chargeback-protection`,
        },
        {
          title: "Merchant Dashboard",
          description: "Balances, payments, disputes, analytics",
          href: `${DOCS}/merchant-dashboard/login-account-access`,
        },
      ],
    },
  ],
}

// The blog's own categories plus the industries listed on the homepage.
const SOLUTIONS: NavMenu = {
  label: "Solutions",
  groups: [
    {
      heading: "Industries",
      items: [
        { title: "Gaming", description: "Pay-ins and instant player payouts", href: "#" },
        { title: "Marketplaces", description: "Seller onboarding, splits, payouts", href: "#" },
        { title: "Fintech", description: "Pay-ins, payouts, and balances via API", href: "#" },
        { title: "E-commerce", description: "Checkout with local payment methods", href: "#" },
      ],
    },
    {
      heading: "Cross-border",
      items: [
        { title: "Remittance", description: "Instant transfers to bank, card, wallet", href: "#" },
        { title: "Cross-border payroll", description: "Payouts in local currency", href: "#" },
        { title: "Ticketing & live events", description: "Checkout and seller payouts", href: "#" },
        {
          title: "Travel & hospitality",
          description: "Faster settlement for bookings",
          href: `${BLOG}/coinflow-riker-partnership`,
        },
      ],
    },
  ],
}

const DEVELOPERS: NavMenu = {
  label: "Developers",
  groups: [
    {
      heading: "Build",
      items: [
        {
          title: "API reference",
          description: "REST API for pay-ins and payouts",
          href: "https://docs.coinflow.cash/api-reference",
        },
        {
          title: "SDKs",
          description: "React, iOS, Android, Flutter, React Native",
          href: `${DOCS}/checkout/implementation-overview/mobile-app-payments`,
        },
        {
          title: "Webhooks",
          description: "Payment, payout, and settlement events",
          href: `${DOCS}/developer-resources/webhooks`,
        },
      ],
    },
    {
      heading: "Get started",
      items: [
        {
          title: "Docs",
          description: "Guides and implementation paths",
          href: `${DOCS}/product-overview/products-features`,
        },
        {
          title: "Sandbox",
          description: "Test cards and credentials",
          href: `${DOCS}/checkout/testing/testing-credit-cards`,
        },
        { title: "ISV Launchpad", description: "Payments for software platforms", href: "#" },
      ],
    },
  ],
}

const RESOURCES: NavMenu = {
  label: "Resources",
  groups: [
    {
      heading: "Learn",
      items: [
        { title: "Blog", description: "Launches, guides, and partnerships", href: `${BLOG}/` },
        {
          title: "Comparisons",
          description: "vs. Stripe, Airwallex, Checkout.com",
          href: `${BLOG}/coinflow-vs-stripe`,
        },
        {
          title: "PayFac as a Service",
          description: "Buyer's guide for software platforms",
          href: `${BLOG}/payfac-as-a-service`,
        },
      ],
    },
    {
      heading: "Updates",
      items: [
        {
          title: "New at Coinflow",
          description: "Monthly product updates",
          href: `${BLOG}/new-at-coinflow-november-2026`,
        },
        { title: "Trust Center", description: "Security and compliance", href: "#" },
      ],
    },
  ],
}

export const NAV: NavEntry[] = [PRODUCTS, SOLUTIONS, DEVELOPERS, RESOURCES, { label: "Pricing", href: "#" }]
