import type { Transaction } from "@/types"
import { pickWeighted, type Skew } from "./mock-assign"

/**
 * MOCK DATA. The dataset has no merchant field, so each real transaction is
 * assigned to one of these made-up merchants, skewed so a few look unhealthy.
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

const SKEW: Skew<MockMerchant> = {
  // Lots of rejections → critical rejection rate.
  "Harbor Tickets": { rejected: 3 },
  // Failed and abandoned challenges → critical challenge success.
  "Nimbus Gaming": { failed: 2.5, abandoned: 2.5 },
  // Somewhat more rejections → warning.
  "Saltwater Supply": { rejected: 2 },
}

export function mockMerchantFor(transaction: Transaction): MockMerchant {
  return pickWeighted(transaction, MOCK_MERCHANTS, SKEW, "")
}
