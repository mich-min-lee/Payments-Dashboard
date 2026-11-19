# Landing page redesign (concept)

A prototype for a separate case study: a redesign of Coinflow's landing page.
It is a concept, not Coinflow's site.

## Rules
- Original work only. Never pull Coinflow's source code or design assets from their site.
  Exception (approved by the user): Coinflow's logo (`public/coinflow.svg`) for this local concept.
  Product facts from coinflow.cash, its docs, and its blog are fine as content.
- The on-page "concept / not affiliated" badge was removed at the user's request (Nov 2026). The
  page title keeps "(concept)". Because the page carries Coinflow's logo and copy with no visible
  disclaimer, never deploy it publicly or share it as if it were the official site.

## Voice and copy
- Audience: companies with an intermediate understanding of payments (product, engineering,
  and finance leads at platforms and marketplaces). Don't simplify for a general audience.
- Use industry terminology: acceptance, pay-ins, disbursements/payouts, settlement, card issuing,
  3DS, local payment methods, KYC/KYB, reconciliation, chargebacks/disputes.
- Be specific: name payment methods, rails, and capabilities instead of generic benefits.
- Never invent capability claims (methods, countries, speeds, compliance). Use the user's
  product facts; mark anything unconfirmed as a placeholder.
- Nav groups follow the money flow, matching the hero: Acceptance → Disbursements → Operations.

## Setup
- Vite + React + Tailwind v4, run with `pnpm --filter landing-redesign dev` (port 3002)
  or `pnpm dev:landing` from the repo root.
- Shadcn components and the theme are shared with the dashboard at the repo root:
  `@/` points to the root `src/`, and `src/index.css` imports the root theme. This app's
  own files use relative imports.
- Add new shadcn components from the repo root only (`pnpm exec shadcn add <component>`),
  so they land in the shared `src/components/ui` with the root `components.json` theme.
  The root CLAUDE.md rules for shadcn apply here too.
