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
  funnel: FunnelMetrics
  /** What's off for this merchant, most urgent first. */
  issues: Issue[]
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
    const funnel = funnelMetrics(group)
    return {
      merchant,
      threeDsRate: threeDsRate(group),
      threeDsOutcomes: threeDsOutcomes(group),
      challengeOutcomes: challengeOutcomes(group),
      funnel,
      issues: issuesOf(funnel),
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

export const FUNNEL_KEYS = [
  "threeDs",
  "frictionless",
  "challenge",
  "rejected",
  "success",
  "failed",
  "abandoned",
] as const satisfies readonly (keyof FunnelMetrics)[]

export type Period = "today" | "week" | "month"

const PERIOD_DAYS = { today: 1, week: 7, month: 30 } as const satisfies Record<Period, number>

/** The dataset covers 30 days, so a month has no previous month to compare with. */
const HAS_COMPARISON = { today: true, week: true, month: false } as const satisfies Record<Period, boolean>

/** A funnel number for a period, plus its change vs. the period before (null = no comparison). */
export interface PeriodStat extends FunnelStat {
  change: number | null
}

export interface PeriodSummary {
  period: Period
  /** Inclusive "YYYY-MM-DD" range. */
  from: string
  to: string
  stats: Record<keyof FunnelMetrics, PeriodStat>
}

/** "2026-02-03" shifted by n days, in UTC so time zones can't move it. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Funnel numbers for the last day, 7 days, or 30 days of the data, with the change
 * vs. the same length of time just before. Null when there are no transactions.
 */
export function periodSummary(
  transactions: readonly Transaction[],
  period: Period,
): PeriodSummary | null {
  if (transactions.length === 0) return null

  // "YYYY-MM-DD" strings sort and compare like dates.
  const to = transactions.reduce((latest, t) => (t.date > latest ? t.date : latest), "")
  const days = PERIOD_DAYS[period]
  const from = shiftDate(to, -(days - 1))
  const between = (start: string, end: string) =>
    transactions.filter((t) => t.date >= start && t.date <= end)

  const current = funnelMetrics(between(from, to))
  const previous = HAS_COMPARISON[period]
    ? funnelMetrics(between(shiftDate(from, -days), shiftDate(from, -1)))
    : null

  const stats = Object.fromEntries(
    FUNNEL_KEYS.map((key) => {
      const now = current[key].ratio.rate
      const before = previous?.[key].ratio.rate ?? null
      const change = now === null || before === null ? null : now - before
      return [key, { ...current[key], change }]
    }),
  ) as Record<keyof FunnelMetrics, PeriodStat>

  return { period, from, to, stats }
}

// ─── Merchant detail: "wait, what's that?" ────────────────────────────────────

/** The six outcome rates ops can drill into (everything in the funnel except 3DS rate). */
export const OUTCOME_KEYS = [
  "frictionless",
  "challenge",
  "rejected",
  "success",
  "failed",
  "abandoned",
] as const satisfies readonly (keyof FunnelMetrics)[]

export type OutcomeKey = (typeof OUTCOME_KEYS)[number]

export const OUTCOME_THRESHOLDS: Record<OutcomeKey, HealthThreshold> = {
  frictionless: HEALTH_THRESHOLDS.frictionless,
  challenge: HEALTH_THRESHOLDS.challenge,
  rejected: HEALTH_THRESHOLDS.rejection,
  success: HEALTH_THRESHOLDS.challengeSuccess,
  failed: HEALTH_THRESHOLDS.failed,
  abandoned: HEALTH_THRESHOLDS.abandonment,
}

/** Ops' priority order (from the ops interview), used to break ties. */
const OPS_PRIORITY: readonly OutcomeKey[] = ["abandoned", "frictionless", "rejected", "success", "failed", "challenge"]

/** Fewer transactions than this: "too few to tell yet". */
export const MIN_SAMPLE = 30
/** Healthy for this many days in a row = recovered. */
export const RECOVERY_DAYS = 2
/** Daily numbers per merchant are tiny, so each day pools the last few days. */
export const ROLLING_DAYS = 3

export interface Issue {
  key: OutcomeKey
  health: "warning" | "critical"
  ratio: Ratio
}

/** The off rates in a funnel: critical before warning, then ops' priority order. */
export function issuesOf(funnel: FunnelMetrics): Issue[] {
  const issues: Issue[] = []
  for (const key of OUTCOME_KEYS) {
    const { health, ratio } = funnel[key]
    if (health === "warning" || health === "critical") issues.push({ key, health, ratio })
  }
  return issues.sort(
    (a, b) =>
      Number(b.health === "critical") - Number(a.health === "critical") ||
      OPS_PRIORITY.indexOf(a.key) - OPS_PRIORITY.indexOf(b.key),
  )
}

/** Every date from the earliest to the latest transaction, so lines line up day by day. */
export function dateRange(transactions: readonly Transaction[]): string[] {
  if (transactions.length === 0) return []
  let first = transactions[0].date
  let last = first
  for (const t of transactions) {
    if (t.date < first) first = t.date
    if (t.date > last) last = t.date
  }
  const dates: string[] = []
  for (let d = first; d <= last; d = shiftDate(d, 1)) dates.push(d)
  return dates
}

export interface TrendPoint {
  date: string
  /** Pooled over this day and the ROLLING_DAYS - 1 days before it. */
  ratio: Ratio
  health: Health | null
}

/** One outcome rate per day, smoothed by pooling the last few days. */
export function rollingTrend(
  transactions: readonly Transaction[],
  key: OutcomeKey,
  dates: readonly string[],
  window: number = ROLLING_DAYS,
): TrendPoint[] {
  const byDate = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const day = byDate.get(t.date)
    if (day) day.push(t)
    else byDate.set(t.date, [t])
  }
  return dates.map((date, i) => {
    const pooled = dates.slice(Math.max(0, i - window + 1), i + 1).flatMap((d) => byDate.get(d) ?? [])
    const { ratio } = funnelMetrics(pooled)[key]
    return { date, ratio, health: healthOf(ratio.rate, OUTCOME_THRESHOLDS[key]) }
  })
}

/** The 3DS outcomes the trend chart plots, in the same order as the table and summary. */
export const TREND_KEYS = ["frictionless", "challenge", "rejected"] as const satisfies readonly OutcomeKey[]

export type TrendKey = (typeof TREND_KEYS)[number]

/**
 * One raw rate per day for each 3DS outcome (no pooling: the full dataset has ~200 trnx a day).
 * The caller passes the dates, so a filtered view keeps the same x-axis as the full one.
 */
export function dailyTrends(
  transactions: readonly Transaction[],
  dates: readonly string[],
): Record<TrendKey, TrendPoint[]> {
  return mapStatuses(TREND_KEYS, (key) => rollingTrend(transactions, key, dates, 1))
}

/**
 * Top of a trend chart's y-axis: one 10% step above the highest rate or threshold,
 * so both threshold lines always show with room above them. Never above 100%.
 */
export function trendCeiling(points: readonly TrendPoint[], threshold: HealthThreshold): number {
  const top = Math.max(threshold.healthy, threshold.critical, ...points.map((p) => p.ratio.rate ?? 0))
  // Whole steps of 10, then divide, so float error can't give 0.30000000000000004.
  return Math.min(10, Math.floor(top * 10) + 1) / 10
}

export type TrendStatus = "ongoing" | "improving" | "recovered" | "healthy"

export interface TrendStory {
  status: TrendStatus
  /** First day of the most recent off stretch. Null if it was never off. */
  onset: string | null
  /** Last off day of that stretch. */
  lastOff: string | null
}

/**
 * When it started and whether it's still going. Recovered = healthy for the last
 * RECOVERY_DAYS days; improving = healthy lately, but not for long enough yet.
 */
export function trendStory(points: readonly TrendPoint[]): TrendStory {
  const isOff = (p: TrendPoint) => p.health === "warning" || p.health === "critical"
  let lastOffIndex = -1
  points.forEach((p, i) => {
    if (isOff(p)) lastOffIndex = i
  })
  if (lastOffIndex === -1) return { status: "healthy", onset: null, lastOff: null }

  let onsetIndex = lastOffIndex
  while (onsetIndex > 0 && isOff(points[onsetIndex - 1])) onsetIndex--
  const onset = points[onsetIndex].date
  const lastOff = points[lastOffIndex].date

  if (lastOffIndex === points.length - 1) return { status: "ongoing", onset, lastOff }
  const healthyTail = points.slice(lastOffIndex + 1).filter((p) => p.health === "healthy").length
  return { status: healthyTail >= RECOVERY_DAYS ? "recovered" : "improving", onset, lastOff }
}

export interface BankRate {
  bank: string
  ratio: Ratio
  health: Health | null
}

const SEVERITY = { critical: 0, warning: 1, healthy: 2 } as const

/** One outcome rate per bank, worst first. */
export function bankBreakdown(
  transactions: readonly Transaction[],
  key: OutcomeKey,
  bankOf: (transaction: Transaction) => string,
): BankRate[] {
  const { direction } = OUTCOME_THRESHOLDS[key]
  const byBank = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const bank = bankOf(t)
    const group = byBank.get(bank)
    if (group) group.push(t)
    else byBank.set(bank, [t])
  }
  return [...byBank.entries()]
    .map(([bank, group]) => {
      const { ratio } = funnelMetrics(group)[key]
      return { bank, ratio, health: healthOf(ratio.rate, OUTCOME_THRESHOLDS[key]) }
    })
    .sort((a, b) => {
      const bySeverity = (a.health ? SEVERITY[a.health] : 3) - (b.health ? SEVERITY[b.health] : 3)
      // Same status: the further in the bad direction, the worse.
      const badness = (r: BankRate) => (direction === "lower-is-better" ? 1 : -1) * (r.ratio.rate ?? 0)
      return bySeverity || badness(b) - badness(a) || a.bank.localeCompare(b.bank)
    })
}

/** Ops' next step depends on this: one bank → that bank; most banks → our side or the merchant's. */
export type BankVerdict = "one-bank" | "across-banks" | "none" | "unclear"

export function bankVerdict(banks: readonly BankRate[]): BankVerdict {
  // Ignore banks with too few transactions to judge.
  const judged = banks.filter((b) => b.ratio.total >= MIN_SAMPLE)
  const off = judged.filter((b) => b.health === "warning" || b.health === "critical")
  if (off.length === 0) return "none"
  if (off.length === 1 && judged.length > 1) return "one-bank"
  if (off.length >= Math.ceil(judged.length / 2)) return "across-banks"
  return "unclear"
}

export interface BankSummary {
  verdict: BankVerdict
  /** The worst bank with enough transactions to judge. */
  worst: BankRate | null
  /** Every other judged bank pooled together: "others around 20%". */
  rest: Ratio | null
  /** Lowest and highest judged bank rate: "spread across banks (16–21%)". */
  range: [number, number] | null
}

export function bankSummary(banks: readonly BankRate[]): BankSummary {
  const judged = banks.filter((b) => b.ratio.total >= MIN_SAMPLE && b.ratio.rate !== null)
  const verdict = bankVerdict(banks)
  if (judged.length === 0) return { verdict, worst: null, rest: null, range: null }

  // bankBreakdown already sorts worst first.
  const [worst, ...others] = judged
  const rest = others.length
    ? ratio(
        others.reduce((sum, b) => sum + b.ratio.count, 0),
        others.reduce((sum, b) => sum + b.ratio.total, 0),
      )
    : null
  const rates = judged.map((b) => b.ratio.rate ?? 0)
  return { verdict, worst, rest, range: [Math.min(...rates), Math.max(...rates)] }
}

export interface MerchantDetail {
  key: OutcomeKey
  /** The whole month for this merchant. */
  overall: FunnelStat
  /** Too few transactions to trust the rate. */
  smallSample: boolean
  trend: TrendPoint[]
  story: TrendStory
  banks: BankSummary
}

export function merchantDetail(
  transactions: readonly Transaction[],
  merchant: string,
  key: OutcomeKey,
  merchantOf: (transaction: Transaction) => string,
  bankOf: (transaction: Transaction) => string,
): MerchantDetail {
  const dates = dateRange(transactions)
  const mine = transactions.filter((t) => merchantOf(t) === merchant)
  const overall = funnelMetrics(mine)[key]
  const trend = rollingTrend(mine, key, dates)

  return {
    key,
    overall,
    smallSample: overall.ratio.total < MIN_SAMPLE,
    trend,
    story: trendStory(trend),
    banks: bankSummary(bankBreakdown(mine, key, bankOf)),
  }
}
