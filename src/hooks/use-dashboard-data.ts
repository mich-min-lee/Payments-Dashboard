import { useEffect, useState } from "react"
import {
  CHALLENGE_STATUSES,
  THREE_DS_STATUSES,
  type ChallengeStatus,
  type ThreeDsStatus,
  type Transaction,
} from "@/types"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isThreeDsStatus(value: unknown): value is ThreeDsStatus {
  return typeof value === "string" && (THREE_DS_STATUSES as readonly string[]).includes(value)
}

function isChallengeStatus(value: unknown): value is ChallengeStatus {
  return typeof value === "string" && (CHALLENGE_STATUSES as readonly string[]).includes(value)
}

/** Returns a Transaction if the record has the expected shape, otherwise null. */
export function parseTransaction(raw: unknown): Transaction | null {
  if (typeof raw !== "object" || raw === null) return null
  const { id, date, threeDsStatus, challengeStatus } = raw as Record<string, unknown>

  if (typeof id !== "string") return null
  if (typeof date !== "string" || !DATE_PATTERN.test(date)) return null
  if (threeDsStatus !== undefined && !isThreeDsStatus(threeDsStatus)) return null
  if (challengeStatus !== undefined) {
    // A challenge outcome only makes sense on a challenged transaction.
    if (threeDsStatus !== "challenge" || !isChallengeStatus(challengeStatus)) return null
  }

  return { id, date, threeDsStatus, challengeStatus }
}

/** Keeps the valid records and counts the rest, so bad data is never dropped silently. */
export function parseTransactions(raw: unknown): { transactions: Transaction[]; skipped: number } {
  if (!Array.isArray(raw)) throw new Error("Expected the data to be a list of transactions")

  const transactions: Transaction[] = []
  let skipped = 0
  for (const item of raw as unknown[]) {
    const transaction = parseTransaction(item)
    if (transaction) transactions.push(transaction)
    else skipped++
  }
  return { transactions, skipped }
}

const DATA_URL =
  "https://gist.githubusercontent.com/bmeeder22/ba2921a5791125fe33218da7e241628e/raw/c2d240421686ee1be38094b51ff1ea94ff3dc7e9/3ds_data.json"

export type DashboardData =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; transactions: Transaction[]; skipped: number }

/** Fetches the transactions once and returns loading, error, or the parsed data. */
export function useDashboardData(): DashboardData {
  const [state, setState] = useState<DashboardData>({ status: "loading" })

  useEffect(() => {
    // Cancels the request if the component goes away before it finishes.
    const controller = new AbortController()

    fetch(DATA_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Couldn't load data (HTTP ${response.status})`)
        return response.json() as Promise<unknown>
      })
      .then((json) => setState({ status: "success", ...parseTransactions(json) }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: "error",
          error: error instanceof Error ? error.message : "Something went wrong",
        })
      })

    return () => controller.abort()
  }, [])

  return state
}
