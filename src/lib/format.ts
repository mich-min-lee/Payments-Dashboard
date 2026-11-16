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

/** 0.019 with "vs yesterday" → "Up 1.9 pts vs yesterday". */
export function formatChange(change: number, comparedWith: string): string {
  const points = Math.abs(change * 100)
  if (points < 0.05) return `No change ${comparedWith}`
  return `${change > 0 ? "Up" : "Down"} ${points.toFixed(1)} pts ${comparedWith}`
}

/** "2026-02-03"–"2026-03-04" → "Feb 3 – Mar 4"; one day → "Mar 4". */
export function formatDayRange(from: string, to: string): string {
  return from === to ? formatDay(to) : `${formatDay(from)} – ${formatDay(to)}`
}
