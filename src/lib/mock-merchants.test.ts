import { describe, expect, it } from "vitest"
import type { Transaction } from "@/types"
import { MOCK_MERCHANTS, mockMerchantFor } from "./mock-merchants"

const tx = (id: string, fields: Partial<Transaction> = {}): Transaction => ({
  id,
  date: "2026-02-03",
  ...fields,
})

describe("mockMerchantFor", () => {
  it("always gives the same merchant for the same transaction", () => {
    const t = tx("txn_000042", { threeDsStatus: "rejected" })
    expect(mockMerchantFor(t)).toBe(mockMerchantFor(t))
  })

  it("only returns names from the mock list", () => {
    for (let i = 0; i < 100; i++) {
      expect(MOCK_MERCHANTS).toContain(mockMerchantFor(tx(`txn_${i}`)))
    }
  })

  it("sends Harbor Tickets more than its even share of rejections", () => {
    const n = 6000
    let harbor = 0
    for (let i = 0; i < n; i++) {
      if (mockMerchantFor(tx(`txn_${i}`, { threeDsStatus: "rejected" })) === "Harbor Tickets") harbor++
    }
    expect(harbor / n).toBeGreaterThan(1.5 / MOCK_MERCHANTS.length)
  })
})
