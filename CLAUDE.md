@AGENTS.md

# Project context: 3DS analytics dashboard

## What this is
A practice build of Coinflow's design engineer case study: a dashboard that shows
merchants and the ops team how 3D Secure (3DS) is performing. I'm using it to learn
React, TypeScript, Tailwind, Radix, and shadcn/ui well enough to explain every
decision, and to rehearse the real 2-hour case.

Where it lives: the internal **admin** dashboard (used by ops), under
General › Analytics › Fraud Analytics. Not the merchant-facing dashboard.

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
(Radix base, theme from `components.json`), Recharts through shadcn Chart, TanStack Table v9,
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
  frictionless, challenge, rejection, in that order (same order as the summary).
- 3DS rate shows the raw counts with units under the percentage
  ("1,014 3DS trnx / 1,333 total trnx"). No formula text. Other counts say "N trnx".
- Hovering a challenge value shows a tooltip titled "Challenge outcomes" with
  success, failure, and abandonment rates, plus an arrow button that opens a side panel.
- The side panel shows challenge outcomes per day and marks the biggest shift.
- Above the table: a search input and a toggle between table and line chart.
- Sortable headers.

Note: the dataset has no merchant field. Treat the merchant table as a concept that
needs mock data, and never invent merchant values silently: assign mock merchants
deterministically and label them as mock wherever they appear.

## Decisions from the dashboard mockup
- Health status always comes from the fixed thresholds in `HEALTH_THRESHOLDS`
  (`src/lib/metrics.ts`): healthy / warning / critical. Never from period-over-period
  change.
- Time period toggle: Today, This week, This month (the last 1, 7, or 30 days of data).
- No "vs yesterday / last week" change lines in the summary (removed on request).
- Summary status (deliberate exception to "pair color with a text label"): critical
  numbers are red with an exclamation icon; warning numbers are amber with no icon;
  healthy numbers are plain. Screen readers still hear "Critical" / "Warning".

## How ops uses the merchant detail (from an ops interview)
- The table is the routine check; a click means "wait, what's that?" So the table must
  visibly flag off merchants (health color on the row/cell) to prompt the click.
- Questions the detail answers, in order:
  1. Real or a small-sample blip? Show volume with the rate. Under 30 trnx: say
     "too few to tell yet".
  2. When did it start? One onset date (to line up with releases or bank changes).
  3. Still going or recovered? Recovered = back within the healthy range for the
     last 2 days.
- Banks are mock data (the dataset has none): fictional names, made-up numbers,
  labeled as mock.

### Merchant detail MVP (second interview: ops replayed a real 2-minute incident)
Ops checked count → when it started → bank split, then acted, and looked at nothing else.
The detail opens inline under the row (never squeeze the table) and shows only:
1. Bank line, first: "One bank: X at 58% · others around 20%", or "Spread across all
   banks (16–21%)". This decides who ops contacts.
2. Count line: rate, trnx volume, "started Feb 28, still going" / "recovered", or
   "too few to tell yet".
3. A small line (~64px) to tell a cliff from a slow climb.
It shows the merchant's most urgent problem only (no rate picker).
Cut until needed: full bank list, everyone-else comparison, related rates, a suggested
next step, day-by-day numbers, raw transactions.

## Code rules
- Metric calculations are pure functions in one file, with Vitest tests. No
  calculations inside components.
- Fetching and parsing live in a `useDashboardData` hook.
- No `any`. Narrow optional fields before using them.
- Health colors are semantic tokens (healthy, warning, critical) with light and dark
  values. Always pair color with a text label.
- Use shadcn components before writing custom ones. Don't add a library without asking.
- Add shadcn components only through the CLI, from the repo root:
  `pnpm exec shadcn add <component>`. The theme (style and base color)
  comes from `components.json`, so never hand-write a component, paste code from the
  shadcn docs (they show the new-york style), pass `--style`, or edit `components.json`
  without asking. Use `--dry-run` or `--diff` to check before overwriting.
- Use a component's own `variant` / `size` props before adding custom classes to restyle
  it, so it keeps the theme's look.

## How to work with me
I'm learning, so I work in two modes and will tell you which one we're in.
- Learning mode: explain, review, and quiz me. Don't write the code for me.
- Build mode: write code in small diffs and explain any non-obvious choice in one line.
In both modes, tell me when something I ask for is a bad idea and why.
If I haven't said which mode we're in, ask before writing feature code.

## How the work is judged
Design thinking 35%, visual craft 20%, code quality 20%, AI fluency 15%,
communication 10%. Favor a few polished views over many average ones.
