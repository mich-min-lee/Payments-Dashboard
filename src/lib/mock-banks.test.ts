import { describe, expect, it } from "vitest"
import type { Transaction } from "@/types"
import { mockMerchantFor } from "./mock-merchants"
import { MOCK_BANKS, mockBankFor } from "./mock-banks"

const tx = (id: string, fields: Partial<Transaction> = {}): Transaction => ({ id, date: "2026-02-03", ...fields })

describe("mockBankFor", () => {
  it("always gives the same bank, from the mock list", () => {
    const t = tx("txn_000042")
    expect(mockBankFor(t)).toBe(mockBankFor(t))
    expect(MOCK_BANKS).toContain(mockBankFor(t))
  })

  it("is independent of the merchant assignment", () => {
    const pairs = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const t = tx(`txn_${i}`)
      pairs.add(`${mockMerchantFor(t)}|${mockBankFor(t)}`)
    }
    // 6 merchants x 5 banks: independent picks should hit most combinations.
    expect(pairs.size).toBeGreaterThan(25)
  })
})
