/**
 * MOCK DATA. The dataset has no merchant field, so each transaction is assigned
 * to one of these made-up merchants by hashing its id. Same id → same merchant,
 * every time. Anything that shows these names must label them as mock.
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

/** FNV-1a: a tiny, stable string hash. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function mockMerchantFor(transactionId: string): MockMerchant {
  return MOCK_MERCHANTS[hash(transactionId) % MOCK_MERCHANTS.length]
}
