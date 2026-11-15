@AGENTS.md

# Project context: 3DS analytics dashboard

## What this is
A practice build of Coinflow's design engineer case study: a dashboard that shows
merchants and the ops team how 3D Secure (3DS) is performing. I'm using it to learn
React, TypeScript, Tailwind, Radix, and shadcn/ui well enough to explain every
decision, and to rehearse the real 2-hour case.

## The data
Fetch with HTTP GET. No backend, auth, or routing.
https://gist.githubusercontent.com/bmeeder22/ba2921a5791125fe33218da7e241628e/raw/c2d240421686ee1be38094b51ff1ea94ff3dc7e9/3ds_data.json

    interface Transaction {
      id: string;
      date: string;
      threeDsStatus?: "rejected" | "frictionless" | "challenge";
      challengeStatus?: "success" | "failed" | "abandoned";
    }

30 days of transactions. A record with no threeDsStatus did not go through 3DS.

All data comes from the gist via the `useDashboardData` hook. There is no local copy
of the dataset in the app.

## Metrics and what each divides by
- 3DS rate: transactions with a threeDsStatus, out of all transactions.
- 3DS outcomes: challenge, rejected, frictionless, out of 3DS transactions.
- Challenge outcomes: success, failed, abandoned, out of challenged transactions.

## Stack
Vite 8, React 19, strict TypeScript, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui
(Radix base, `radix-maia` style), Recharts through shadcn Chart, TanStack Table v9,
Vitest, oxlint.

- Single-page app: `index.html` → `src/main.tsx` → `src/App.tsx`. Global styles and
  theme tokens are in `src/index.css`. `@/` is an alias for `src/`.
- Scripts: `pnpm dev` (port 3001), `pnpm build` (type-check + build), `pnpm lint`.
- No Next.js: no `"use client"`, server components, or `next/*` imports.
- TanStack Table is v9 (`useTable`, `tableFeatures`), not v8 (`useReactTable`). Load
  the bundled skills via Intent (see AGENTS.md) before writing table code.

## Required features
- Summary KPI cards, each with a health status (healthy, warning, critical).
- A trend over time (line chart of daily rates).
- A breakdown of where 3DS transactions end up.
- It must answer "is everything okay?" in under 3 seconds.

## Table design already decided
- One row per merchant (aggregated from that merchant's transactions), not one row
  per transaction.
- Columns: merchant name, 3DS rate, then a "3DS outcomes" column group holding
  challenge, rejection, frictionless, in that order.
- 3DS rate shows a caption with the formula and the raw counts under the percentage.
- Hovering a challenge value shows a tooltip titled "Challenge outcomes" with
  success, failure, and abandonment rates, plus an arrow button that opens a side panel.
- The side panel shows challenge outcomes per day and marks the biggest shift.
- Above the table: a search input and a toggle between table and line chart.
- Sortable headers.

Note: the dataset has no merchant field. Treat the merchant table as a concept that
needs mock data, and never invent merchant values silently: assign mock merchants
deterministically and label them as mock wherever they appear.

## Code rules
- Metric calculations are pure functions in one file, with Vitest tests. No
  calculations inside components.
- Fetching and parsing live in a `useDashboardData` hook.
- No `any`. Narrow optional fields before using them.
- Health colors are semantic tokens (healthy, warning, critical) with light and dark
  values. Always pair color with a text label.
- Use shadcn components before writing custom ones. Don't add a library without asking.

## How to work with me
I'm learning, so I work in two modes and will tell you which one we're in.
- Learning mode: explain, review, and quiz me. Don't write the code for me.
- Build mode: write code in small diffs and explain any non-obvious choice in one line.
In both modes, tell me when something I ask for is a bad idea and why.
If I haven't said which mode we're in, ask before writing feature code.

## How the work is judged
Design thinking 35%, visual craft 20%, code quality 20%, AI fluency 15%,
communication 10%. Favor a few polished views over many average ones.
