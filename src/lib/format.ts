import type { HealthThreshold } from "@/lib/metrics"

/** 0.702 → "70.2%". Null (nothing to divide by) → "—". */
export function formatPercent(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`
}

/** "2026-02-28" → "Feb 28". */
export function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

/** "2026-02-03"–"2026-03-04" → "Feb 3 – Mar 4"; one day → "Mar 4". */
export function formatDayRange(from: string, to: string): string {
  return from === to ? formatDay(to) : `${formatDay(from)} – ${formatDay(to)}`
}

/** 0.6 → "60%". For axis ticks and thresholds, where a decimal is noise. */
export function formatPercentWhole(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

/** { higher-is-better, 0.6, 0.5 } → "Healthy at 60% or more · critical under 50%". */
export function describeThreshold(threshold: HealthThreshold): string {
  const healthy = formatPercentWhole(threshold.healthy)
  const critical = formatPercentWhole(threshold.critical)
  return threshold.direction === "higher-is-better"
    ? `Healthy at ${healthy} or more · critical under ${critical}`
    : `Healthy at ${healthy} or less · critical over ${critical}`
}
