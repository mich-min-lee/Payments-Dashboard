import { describe, expect, it } from "vitest"
import type { Transaction } from "@/types"
import {
  biggestChallengeShift,
  challengeOutcomes,
  dailyMetrics,
  HEALTH_THRESHOLDS,
  healthOf,
  merchantMetrics,
  ratio,
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

describe("dailyMetrics", () => {
  it("groups by date, oldest first", () => {
    const days = dailyMetrics([
      tx({ date: "2026-02-04", threeDsStatus: "frictionless" }),
      tx({ date: "2026-02-03" }),
      tx({ date: "2026-02-03", threeDsStatus: "rejected" }),
    ])
    expect(days.map((d) => d.date)).toEqual(["2026-02-03", "2026-02-04"])
    expect(days[0].threeDsRate.rate).toBe(0.5)
    expect(days[1].threeDsRate.rate).toBe(1)
  })
})

describe("biggestChallengeShift", () => {
  it("finds the largest day-over-day change, up or down", () => {
    const days = dailyMetrics([
      // Day 1: success 100%
      tx({ date: "2026-02-03", threeDsStatus: "challenge", challengeStatus: "success" }),
      // Day 2: success 50%, failed 50%
      tx({ date: "2026-02-04", threeDsStatus: "challenge", challengeStatus: "success" }),
      tx({ date: "2026-02-04", threeDsStatus: "challenge", challengeStatus: "failed" }),
    ])
    const shift = biggestChallengeShift(days)
    expect(shift?.date).toBe("2026-02-04")
    expect(Math.abs(shift?.change ?? 0)).toBe(0.5)
  })

  it("skips days with no challenges instead of treating them as 0%", () => {
    const days = dailyMetrics([
      tx({ date: "2026-02-03", threeDsStatus: "challenge", challengeStatus: "success" }),
      tx({ date: "2026-02-04", threeDsStatus: "frictionless" }),
    ])
    expect(biggestChallengeShift(days)).toBeNull()
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
  })
})
