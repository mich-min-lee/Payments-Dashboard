import type { Transaction } from "@/types"

/**
 * MOCK DATA. The dataset has no merchant field, so each real transaction is
 * assigned to one of these made-up merchants. Assignment is deterministic
 * (same transaction → same merchant) and deliberately skewed, so a few
 * merchants look unhealthy and the design has something to show.
 * Anything that shows these names must label them as mock.
 */
export const MOCK_MERCHANTS = [
  "Copperleaf Market",
  "Harbor Tickets",
  "Lumen Arcade",
  "Nimbus Gaming",
  "Pinecrest Outfitters",
  "Saltwater Supply",
] as const

export type MockMerchant = (typeof MOCK_MERCHANTS)[number]

type OutcomeKey = "none" | "frictionless" | "rejected" | "success" | "failed" | "abandoned"

/**
 * How much more likely a merchant is to receive each kind of transaction.
 * Anything not listed is 1 (an even share).
 */
const SKEW: Partial<Record<MockMerchant, Partial<Record<OutcomeKey, number>>>> = {
  // Lots of rejections → critical rejection rate.
  "Harbor Tickets": { rejected: 3 },
  // Failed and abandoned challenges → critical challenge success.
  "Nimbus Gaming": { failed: 2.5, abandoned: 2.5 },
  // Somewhat more rejections → warning.
  "Saltwater Supply": { rejected: 2 },
}

function outcomeKey(t: Transaction): OutcomeKey {
  if (t.threeDsStatus === undefined) return "none"
  if (t.threeDsStatus === "challenge") return t.challengeStatus ?? "none"
  return t.threeDsStatus
}

/** A stable string hash mapped to [0, 1): FNV-1a, then a mixing step so similar ids spread evenly. */
function hashToUnit(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 2 ** 32
}

export function mockMerchantFor(transaction: Transaction): MockMerchant {
  const key = outcomeKey(transaction)
  const weights = MOCK_MERCHANTS.map((m) => SKEW[m]?.[key] ?? 1)
  const total = weights.reduce((sum, w) => sum + w, 0)

  let point = hashToUnit(transaction.id) * total
  for (let i = 0; i < MOCK_MERCHANTS.length; i++) {
    point -= weights[i]
    if (point < 0) return MOCK_MERCHANTS[i]
  }
  return MOCK_MERCHANTS[MOCK_MERCHANTS.length - 1]
}
