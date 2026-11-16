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

export type Health = "healthy" | "warning" | "critical"

export interface HealthThreshold {
  direction: "higher-is-better" | "lower-is-better"
  /** Healthy at or past this rate. */
  healthy: number
  /** Critical past this rate. Between the two is warning. */
  critical: number
}

export const HEALTH_THRESHOLDS = {
  challengeSuccess: { direction: "higher-is-better", healthy: 0.7, critical: 0.6 },
  frictionless: { direction: "higher-is-better", healthy: 0.6, critical: 0.5 },
  rejection: { direction: "lower-is-better", healthy: 0.1, critical: 0.15 },
  abandonment: { direction: "lower-is-better", healthy: 0.15, critical: 0.2 },
  challenge: { direction: "lower-is-better", healthy: 0.3, critical: 0.4 },
  failed: { direction: "lower-is-better", healthy: 0.2, critical: 0.25 },
} as const satisfies Record<string, HealthThreshold>

/** Healthy, warning, or critical for a rate. Null when there's no rate to judge. */
export function healthOf(rate: number | null, threshold: HealthThreshold): Health | null {
  if (rate === null) return null
  if (threshold.direction === "higher-is-better") {
    if (rate >= threshold.healthy) return "healthy"
    if (rate >= threshold.critical) return "warning"
    return "critical"
  }
  if (rate <= threshold.healthy) return "healthy"
  if (rate <= threshold.critical) return "warning"
  return "critical"
}

export interface MerchantMetrics {
  merchant: string
  threeDsRate: Ratio
  threeDsOutcomes: Record<ThreeDsStatus, Ratio>
  challengeOutcomes: Record<ChallengeStatus, Ratio>
  daily: DailyMetrics[]
  biggestChallengeShift: ChallengeShift | null
}

/** All metrics per merchant, sorted by name. `merchantOf` decides each transaction's merchant. */
export function merchantMetrics(
  transactions: readonly Transaction[],
  merchantOf: (transaction: Transaction) => string,
): MerchantMetrics[] {
  const byMerchant = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const merchant = merchantOf(t)
    const group = byMerchant.get(merchant)
    if (group) group.push(t)
    else byMerchant.set(merchant, [t])
  }
  return [...byMerchant.keys()].sort().map((merchant) => {
    const group = byMerchant.get(merchant) ?? []
    const daily = dailyMetrics(group)
    return {
      merchant,
      threeDsRate: threeDsRate(group),
      threeDsOutcomes: threeDsOutcomes(group),
      challengeOutcomes: challengeOutcomes(group),
      daily,
      biggestChallengeShift: biggestChallengeShift(daily),
    }
  })
}

/** One number in the funnel: the ratio plus its health (null = no badge). */
export interface FunnelStat {
  ratio: Ratio
  health: Health | null
}

/**
 * The three funnel levels. Each level divides by the one above it:
 * all → 3DS → challenged.
 */
export interface FunnelMetrics {
  threeDs: FunnelStat
  frictionless: FunnelStat
  challenge: FunnelStat
  rejected: FunnelStat
  success: FunnelStat
  failed: FunnelStat
  abandoned: FunnelStat
}

export function funnelMetrics(transactions: readonly Transaction[]): FunnelMetrics {
  const outcomes = threeDsOutcomes(transactions)
  const challenges = challengeOutcomes(transactions)
  const stat = (ratio: Ratio, threshold: HealthThreshold | null): FunnelStat => ({
    ratio,
    health: threshold ? healthOf(ratio.rate, threshold) : null,
  })

  return {
    // No threshold: more 3DS isn't clearly better or worse.
    threeDs: stat(threeDsRate(transactions), null),
    frictionless: stat(outcomes.frictionless, HEALTH_THRESHOLDS.frictionless),
    challenge: stat(outcomes.challenge, HEALTH_THRESHOLDS.challenge),
    rejected: stat(outcomes.rejected, HEALTH_THRESHOLDS.rejection),
    success: stat(challenges.success, HEALTH_THRESHOLDS.challengeSuccess),
    failed: stat(challenges.failed, HEALTH_THRESHOLDS.failed),
    abandoned: stat(challenges.abandoned, HEALTH_THRESHOLDS.abandonment),
  }
}

/** How loudly a card should speak: size and weight only, never color. */
export type Emphasis = "strong" | "default" | "quiet"

/** Rejected stays quiet until it needs attention. */
export function rejectedEmphasis(health: Health | null): Emphasis {
  return health === "warning" || health === "critical" ? "default" : "quiet"
}
