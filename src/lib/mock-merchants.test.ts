import { describe, expect, it } from "vitest"
import { MOCK_MERCHANTS, mockMerchantFor } from "./mock-merchants"

describe("mockMerchantFor", () => {
  it("always gives the same merchant for the same id", () => {
    expect(mockMerchantFor("txn_000042")).toBe(mockMerchantFor("txn_000042"))
  })

  it("only returns names from the mock list", () => {
    for (let i = 0; i < 100; i++) {
      expect(MOCK_MERCHANTS).toContain(mockMerchantFor(`txn_${i}`))
    }
  })
})
