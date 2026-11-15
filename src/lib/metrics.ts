import {
  CHALLENGE_STATUSES,
  THREE_DS_STATUSES,
  type ChallengeStatus,
  type ThreeDsStatus,
  type Transaction,
} from "@/types"

/** A part out of a whole. `rate` is null when there's nothing to divide by. */
export interface Ratio {
  count: number
  total: number
  rate: number | null
}

export function ratio(count: number, total: number): Ratio {
  return { count, total, rate: total === 0 ? null : count / total }
}

/** Transactions with a 3DS status, out of all transactions. */
export function threeDsRate(transactions: readonly Transaction[]): Ratio {
  const withThreeDs = transactions.filter((t) => t.threeDsStatus !== undefined).length
  return ratio(withThreeDs, transactions.length)
}

/** Challenge, rejected, frictionless, out of 3DS transactions. */
export function threeDsOutcomes(
  transactions: readonly Transaction[],
): Record<ThreeDsStatus, Ratio> {
  const counts: Record<ThreeDsStatus, number> = { challenge: 0, rejected: 0, frictionless: 0 }
  let total = 0
  for (const t of transactions) {
    if (t.threeDsStatus === undefined) continue
    counts[t.threeDsStatus]++
    total++
  }
  return mapStatuses(THREE_DS_STATUSES, (status) => ratio(counts[status], total))
}

/** Success, failed, abandoned, out of challenged transactions. */
export function challengeOutcomes(
  transactions: readonly Transaction[],
): Record<ChallengeStatus, Ratio> {
  const counts: Record<ChallengeStatus, number> = { success: 0, failed: 0, abandoned: 0 }
  let total = 0
  for (const t of transactions) {
    if (t.threeDsStatus !== "challenge") continue
    total++
    if (t.challengeStatus !== undefined) counts[t.challengeStatus]++
  }
  return mapStatuses(CHALLENGE_STATUSES, (status) => ratio(counts[status], total))
}

export interface DailyMetrics {
  date: string
  threeDsRate: Ratio
  threeDsOutcomes: Record<ThreeDsStatus, Ratio>
  challengeOutcomes: Record<ChallengeStatus, Ratio>
}

/** All three metrics for each day, oldest first. */
export function dailyMetrics(transactions: readonly Transaction[]): DailyMetrics[] {
  const byDate = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const day = byDate.get(t.date)
    if (day) day.push(t)
    else byDate.set(t.date, [t])
  }
  return [...byDate.keys()].sort().map((date) => {
    const day = byDate.get(date) ?? []
    return {
      date,
      threeDsRate: threeDsRate(day),
      threeDsOutcomes: threeDsOutcomes(day),
      challengeOutcomes: challengeOutcomes(day),
    }
  })
}

export interface ChallengeShift {
  /** The day the change happened (compared with the day before). */
  date: string
  outcome: ChallengeStatus
  /** Change in rate, e.g. -0.12 means the rate fell 12 percentage points. */
  change: number
}

/** The largest day-over-day move in any challenge outcome rate. */
export function biggestChallengeShift(days: readonly DailyMetrics[]): ChallengeShift | null {
  let biggest: ChallengeShift | null = null
  for (let i = 1; i < days.length; i++) {
    for (const outcome of CHALLENGE_STATUSES) {
      const before = days[i - 1].challengeOutcomes[outcome].rate
      const after = days[i].challengeOutcomes[outcome].rate
      if (before === null || after === null) continue
      const change = after - before
      if (biggest === null || Math.abs(change) > Math.abs(biggest.change)) {
        biggest = { date: days[i].date, outcome, change }
      }
    }
  }
  return biggest
}

function mapStatuses<S extends string, V>(
  statuses: readonly S[],
  fn: (status: S) => V,
): Record<S, V> {
  return Object.fromEntries(statuses.map((s) => [s, fn(s)])) as Record<S, V>
}
