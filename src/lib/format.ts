/** 0.702 → "70.2%". Null (nothing to divide by) → "—". */
export function formatPercent(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`
}

/** A change in rate as percentage points: -0.31 → "−31.0 pts". */
export function formatPoints(change: number): string {
  const sign = change > 0 ? "+" : change < 0 ? "−" : ""
  return `${sign}${Math.abs(change * 100).toFixed(1)} pts`
}

/** "2026-02-28" → "Feb 28". */
export function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}
