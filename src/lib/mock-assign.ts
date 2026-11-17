import type { Transaction } from "@/types"

/**
 * Shared engine for MOCK data the dataset doesn't have (merchants, banks).
 * Each transaction is assigned deterministically (same transaction → same pick),
 * optionally skewed by outcome so some picks look unhealthy on purpose.
 */

export type OutcomeKind = "none" | "frictionless" | "rejected" | "success" | "failed" | "abandoned"

/** How much more likely each pick is to get each kind of transaction. Unlisted = 1. */
export type Skew<Name extends string> = Partial<Record<Name, Partial<Record<OutcomeKind, number>>>>

function outcomeKind(t: Transaction): OutcomeKind {
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

/** `salt` keeps different mock fields (merchant, bank) independent of each other. */
export function pickWeighted<Name extends string>(
  transaction: Transaction,
  names: readonly Name[],
  skew: Skew<Name>,
  salt: string,
): Name {
  const kind = outcomeKind(transaction)
  const weights = names.map((n) => skew[n]?.[kind] ?? 1)
  const total = weights.reduce((sum, w) => sum + w, 0)

  let point = hashToUnit(salt + transaction.id) * total
  for (let i = 0; i < names.length; i++) {
    point -= weights[i]
    if (point < 0) return names[i]
  }
  return names[names.length - 1]
}
