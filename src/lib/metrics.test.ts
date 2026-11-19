import { describe, expect, it } from "vitest"
import type { Transaction } from "@/types"
import {
  challengeOutcomes,
  dailyTrends,
  funnelMetrics,
  trendCeiling,
  HEALTH_THRESHOLDS,
  healthOf,
  merchantMetrics,
  bankBreakdown,
  bankSummary,
  bankVerdict,
  dateRange,
  issuesOf,
  merchantDetail,
  rollingTrend,
  trendStory,
  type TrendPoint,
  ratio,
  periodSummary,
  shiftDate,
  threeDsOutcomes,
  threeDsRate,
} from "./metrics"

let nextId = 0
function tx(fields: Omit<Partial<Transaction>, "id">): Transaction {
  return { id: `t${nextId++}`, date: "2026-02-03", ...fields }
}

describe("ratio", () => {
  it("divides count by total", () => {
    expect(ratio(1, 4)).toEqual({ count: 1, total: 4, rate: 0.25 })
  })

  it("returns a null rate instead of NaN when the total is 0", () => {
    expect(ratio(0, 0).rate).toBeNull()
  })
})

describe("threeDsRate", () => {
  it("counts transactions with any 3DS status out of all transactions", () => {
    const result = threeDsRate([
      tx({ threeDsStatus: "frictionless" }),
      tx({ threeDsStatus: "rejected" }),
      tx({ threeDsStatus: "challenge", challengeStatus: "success" }),
      tx({}),
    ])
    expect(result).toEqual({ count: 3, total: 4, rate: 0.75 })
  })

  it("has no rate for an empty list", () => {
    expect(threeDsRate([]).rate).toBeNull()
  })
})

describe("threeDsOutcomes", () => {
  it("divides by 3DS transactions only, ignoring ones that skipped 3DS", () => {
    const result = threeDsOutcomes([
      tx({ threeDsStatus: "challenge", challengeStatus: "success" }),
      tx({ threeDsStatus: "frictionless" }),
      tx({ threeDsStatus: "frictionless" }),
      tx({ threeDsStatus: "rejected" }),
      tx({}),
      tx({}),
    ])
    expect(result.challenge).toEqual({ count: 1, total: 4, rate: 0.25 })
    expect(result.frictionless).toEqual({ count: 2, total: 4, rate: 0.5 })
    expect(result.rejected).toEqual({ count: 1, total: 4, rate: 0.25 })
  })
})

describe("challengeOutcomes", () => {
  it("divides by challenged transactions only", () => {
    const result = challengeOutcomes([
      tx({ threeDsStatus: "challenge", challengeStatus: "success" }),
      tx({ threeDsStatus: "challenge", challengeStatus: "success" }),
      tx({ threeDsStatus: "challenge", challengeStatus: "failed" }),
      tx({ threeDsStatus: "challenge", challengeStatus: "abandoned" }),
      tx({ threeDsStatus: "frictionless" }),
    ])
    expect(result.success).toEqual({ count: 2, total: 4, rate: 0.5 })
    expect(result.failed.rate).toBe(0.25)
    expect(result.abandoned.rate).toBe(0.25)
  })

  it("has no rates when nothing was challenged", () => {
    expect(challengeOutcomes([tx({ threeDsStatus: "frictionless" })]).success.rate).toBeNull()
  })
})

describe("healthOf", () => {
  const { challengeSuccess, rejection } = HEALTH_THRESHOLDS

  it("higher is better: ≥70% healthy, 60–70% warning, <60% critical", () => {
    expect(healthOf(0.7, challengeSuccess)).toBe("healthy")
    expect(healthOf(0.65, challengeSuccess)).toBe("warning")
    expect(healthOf(0.6, challengeSuccess)).toBe("warning")
    expect(healthOf(0.59, challengeSuccess)).toBe("critical")
  })

  it("lower is better: ≤10% healthy, 10–15% warning, >15% critical", () => {
    expect(healthOf(0.1, rejection)).toBe("healthy")
    expect(healthOf(0.12, rejection)).toBe("warning")
    expect(healthOf(0.15, rejection)).toBe("warning")
    expect(healthOf(0.16, rejection)).toBe("critical")
  })

  it("has no health when there's no rate", () => {
    expect(healthOf(null, challengeSuccess)).toBeNull()
  })
})

describe("merchantMetrics", () => {
  it("groups by merchant and computes each merchant's own rates", () => {
    const a = tx({ threeDsStatus: "frictionless" })
    const b = tx({})
    const c = tx({ threeDsStatus: "rejected" })
    const merchantOf = (t: Transaction) => (t.id === c.id ? "Beta" : "Alpha")

    const rows = merchantMetrics([a, b, c], merchantOf)
    expect(rows.map((r) => r.merchant)).toEqual(["Alpha", "Beta"])
    expect(rows[0].threeDsRate).toEqual({ count: 1, total: 2, rate: 0.5 })
    expect(rows[1].threeDsOutcomes.rejected.rate).toBe(1)
    // One rejected transaction: rejection 100% and frictionless 0%, both critical.
    expect(rows[1].issues.map((i) => i.key)).toEqual(["frictionless", "rejected"])
  })
})

describe("funnelMetrics", () => {
  const funnel = funnelMetrics([
    tx({}),
    tx({ threeDsStatus: "frictionless" }),
    tx({ threeDsStatus: "rejected" }),
    tx({ threeDsStatus: "challenge", challengeStatus: "success" }),
    tx({ threeDsStatus: "challenge", challengeStatus: "abandoned" }),
  ])

  it("divides each level by the level above it", () => {
    expect(funnel.threeDs.ratio).toEqual({ count: 4, total: 5, rate: 0.8 })
    expect(funnel.challenge.ratio).toEqual({ count: 2, total: 4, rate: 0.5 })
    expect(funnel.abandoned.ratio).toEqual({ count: 1, total: 2, rate: 0.5 })
  })

  it("level 2 adds up to 100%, and so does level 3", () => {
    const sum = (...xs: (number | null)[]) => xs.reduce<number>((a, b) => a + (b ?? 0), 0)
    expect(sum(funnel.frictionless.ratio.rate, funnel.challenge.ratio.rate, funnel.rejected.ratio.rate)).toBeCloseTo(1)
    expect(sum(funnel.success.ratio.rate, funnel.failed.ratio.rate, funnel.abandoned.ratio.rate)).toBeCloseTo(1)
  })

  it("gives 3DS rate no health, and judges the rest", () => {
    expect(funnel.threeDs.health).toBeNull()
    expect(funnel.challenge.health).toBe("critical") // 50% > 40%
    expect(funnel.abandoned.health).toBe("critical") // 50% > 20%
  })
})

describe("periodSummary", () => {
  const data = [
    // Feb 1: 0% 3DS
    tx({ date: "2026-02-01" }),
    // Feb 2: 50% 3DS
    tx({ date: "2026-02-02" }),
    tx({ date: "2026-02-02", threeDsStatus: "frictionless" }),
    // Feb 3 (latest): 100% 3DS
    tx({ date: "2026-02-03", threeDsStatus: "rejected" }),
  ]

  it("today is the latest day, compared with the day before", () => {
    const summary = periodSummary(data, "today")
    expect(summary?.from).toBe("2026-02-03")
    expect(summary?.to).toBe("2026-02-03")
    expect(summary?.stats.threeDs.ratio.rate).toBe(1)
    expect(summary?.stats.threeDs.change).toBeCloseTo(0.5) // 100% vs 50%
  })

  it("week covers the last 7 days; no earlier data means no change", () => {
    const summary = periodSummary(data, "week")
    expect(summary?.from).toBe("2026-01-28")
    expect(summary?.stats.threeDs.ratio).toEqual({ count: 2, total: 4, rate: 0.5 })
    expect(summary?.stats.threeDs.change).toBeNull()
  })

  it("month has no comparison", () => {
    expect(periodSummary(data, "month")?.stats.rejected.change).toBeNull()
  })

  it("keeps health from the fixed thresholds", () => {
    // Today: 1 of 1 3DS transactions rejected = 100% > 15%
    expect(periodSummary(data, "today")?.stats.rejected.health).toBe("critical")
  })

  it("is null with no data", () => {
    expect(periodSummary([], "today")).toBeNull()
  })
})

describe("shiftDate", () => {
  it("crosses month boundaries", () => {
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28")
  })
})

describe("issuesOf", () => {
  it("lists off rates, critical first, then ops' priority", () => {
    const funnel = funnelMetrics([
      tx({ threeDsStatus: "rejected" }), // rejected 50% → critical
      tx({ threeDsStatus: "challenge", challengeStatus: "abandoned" }), // abandoned 100% → critical
    ])
    expect(issuesOf(funnel).map((i) => i.key)).toEqual(["abandoned", "frictionless", "rejected", "success", "challenge"])
  })
})

describe("dateRange", () => {
  it("fills in days with no transactions", () => {
    expect(dateRange([tx({ date: "2026-02-28" }), tx({ date: "2026-03-02" })])).toEqual([
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ])
  })
})

describe("rollingTrend", () => {
  it("pools each day with the days before it", () => {
    const dates = ["2026-02-01", "2026-02-02", "2026-02-03", "2026-02-04"]
    const points = rollingTrend(
      [
        tx({ date: "2026-02-01", threeDsStatus: "rejected" }),
        tx({ date: "2026-02-02", threeDsStatus: "frictionless" }),
        tx({ date: "2026-02-04", threeDsStatus: "frictionless" }),
      ],
      "rejected",
      dates,
      3,
    )
    expect(points.map((p) => p.ratio.rate)).toEqual([1, 0.5, 0.5, 0])
    expect(points[3].health).toBe("healthy")
  })
})

describe("dailyTrends", () => {
  it("gives each 3DS outcome one unpooled rate per day, on the dates passed in", () => {
    const dates = ["2026-02-01", "2026-02-02", "2026-02-03"]
    const trends = dailyTrends(
      [
        tx({ date: "2026-02-01", threeDsStatus: "rejected" }),
        tx({ date: "2026-02-01", threeDsStatus: "frictionless" }),
        tx({ date: "2026-02-02", threeDsStatus: "challenge", challengeStatus: "success" }),
        tx({ date: "2026-02-02" }), // no 3DS: not in any outcome's denominator
      ],
      dates,
    )
    expect(Object.keys(trends)).toEqual(["frictionless", "challenge", "rejected"])
    expect(trends.rejected.map((p) => p.ratio.rate)).toEqual([0.5, 0, null])
    expect(trends.challenge.map((p) => p.ratio.rate)).toEqual([0, 1, null])
    expect(trends.challenge[1].health).toBe("critical")
    expect(trends.frictionless[2].health).toBeNull()
  })
})

describe("trendCeiling", () => {
  const point = (rate: number | null): TrendPoint => ({
    date: "2026-02-01",
    ratio: { count: 0, total: 1, rate },
    health: null,
  })

  it("sits one 10% step above the highest rate", () => {
    expect(trendCeiling([point(0.62), point(0.48)], HEALTH_THRESHOLDS.frictionless)).toBe(0.7)
  })

  it("always leaves room above the critical line, even when rates are low", () => {
    expect(trendCeiling([point(0.05), point(null)], HEALTH_THRESHOLDS.rejection)).toBe(0.2)
    expect(trendCeiling([], HEALTH_THRESHOLDS.challenge)).toBe(0.5)
  })

  it("never goes above 100%", () => {
    expect(trendCeiling([point(1)], HEALTH_THRESHOLDS.frictionless)).toBe(1)
  })
})

describe("trendStory", () => {
  const point = (date: string, health: TrendPoint["health"]): TrendPoint => ({
    date,
    health,
    ratio: { count: 0, total: 1, rate: 0 },
  })

  it("is ongoing when the latest day is off, starting at the latest off stretch", () => {
    const story = trendStory([
      point("d1", "critical"),
      point("d2", "healthy"),
      point("d3", "warning"),
      point("d4", "critical"),
    ])
    expect(story).toEqual({ status: "ongoing", onset: "d3", lastOff: "d4" })
  })

  it("is recovered after 2 healthy days, improving after 1", () => {
    expect(trendStory([point("d1", "warning"), point("d2", "healthy"), point("d3", "healthy")]).status).toBe(
      "recovered",
    )
    expect(trendStory([point("d1", "warning"), point("d2", "healthy")]).status).toBe("improving")
  })

  it("is healthy when nothing was ever off", () => {
    expect(trendStory([point("d1", "healthy")])).toEqual({ status: "healthy", onset: null, lastOff: null })
  })
})

describe("bankBreakdown and bankVerdict", () => {
  // 40 frictionless at each bank, plus 40 rejections only at bank B.
  const data = [
    ...Array.from({ length: 40 }, () => tx({ threeDsStatus: "frictionless" as const })).map((t) => ({ ...t, bank: "A" })),
    ...Array.from({ length: 40 }, () => tx({ threeDsStatus: "frictionless" as const })).map((t) => ({ ...t, bank: "B" })),
    ...Array.from({ length: 40 }, () => tx({ threeDsStatus: "rejected" as const })).map((t) => ({ ...t, bank: "B" })),
  ]
  const bankOf = (t: Transaction) => (t as Transaction & { bank: string }).bank

  it("puts the worst bank first", () => {
    const banks = bankBreakdown(data, "rejected", bankOf)
    expect(banks.map((b) => [b.bank, b.health])).toEqual([
      ["B", "critical"],
      ["A", "healthy"],
    ])
  })

  it("says it's one bank when only one is off", () => {
    expect(bankVerdict(bankBreakdown(data, "rejected", bankOf))).toBe("one-bank")
  })

  it("within the same status, puts the worse rate first", () => {
    const twoBad = [
      ...Array.from({ length: 30 }, (_, i) => ({ ...tx({ threeDsStatus: i < 6 ? "rejected" : "frictionless" }), bank: "A" })),
      ...Array.from({ length: 30 }, (_, i) => ({ ...tx({ threeDsStatus: i < 12 ? "rejected" : "frictionless" }), bank: "Z" })),
    ]
    // A: 20%, Z: 40%, both critical. Z is worse even though it sorts later alphabetically.
    expect(bankBreakdown(twoBad, "rejected", bankOf)[0].bank).toBe("Z")
  })

  it("summarizes the worst bank against the rest", () => {
    const summary = bankSummary(bankBreakdown(data, "rejected", bankOf))
    expect(summary.worst?.bank).toBe("B")
    expect(summary.rest?.rate).toBe(0)
    expect(summary.range).toEqual([0, 0.5])
  })

  it("ignores banks with too few transactions", () => {
    const tiny = [tx({ threeDsStatus: "rejected" })]
    expect(bankVerdict(bankBreakdown(tiny, "rejected", () => "A"))).toBe("none")
  })
})

describe("merchantDetail", () => {
  it("uses only this merchant's transactions and flags small samples", () => {
    const mine = tx({ date: "2026-02-03", threeDsStatus: "rejected" })
    const other = tx({ date: "2026-02-03", threeDsStatus: "frictionless" })
    const detail = merchantDetail([mine, other], "Mine", "rejected", (t) => (t.id === mine.id ? "Mine" : "Other"), () => "Bank")
    expect(detail.overall.ratio.rate).toBe(1)
    expect(detail.smallSample).toBe(true)
    expect(detail.story.status).toBe("ongoing")
  })
})
