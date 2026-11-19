import type { Transaction } from "@/types"
import { pickWeighted, type Skew } from "./mock-assign"

/**
 * MOCK DATA. The dataset has no issuing bank, so each real transaction is assigned
 * to one of these fictional banks (fictional on purpose: the numbers are made up).
 * Anything that shows these names must label them as mock.
 */
export const MOCK_BANKS = [
  "Cobalt Credit Union",
  "Juniper Trust",
  "Meridian Card Services",
  "Northbridge Bank",
  "Summit Federal",
] as const

export type MockBank = (typeof MOCK_BANKS)[number]

const SKEW: Skew<MockBank> = {
  // One bank where customers abandon challenges more: a "one bank" story.
  "Northbridge Bank": { abandoned: 3 },
}

export function mockBankFor(transaction: Transaction): MockBank {
  return pickWeighted(transaction, MOCK_BANKS, SKEW, "bank:")
}
