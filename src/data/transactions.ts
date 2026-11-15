import "server-only";
import raw from "./transactions.json";

export const THREE_DS_STATUSES = ["frictionless", "challenge", "rejected"] as const;
export type ThreeDsStatus = (typeof THREE_DS_STATUSES)[number];

export type ChallengeStatus = "success" | "failed" | "abandoned";

export type Transaction = {
  id: string;
  /** ISO date, "YYYY-MM-DD" */
  date: string;
  /** Missing on some rows. */
  threeDsStatus?: ThreeDsStatus;
  /** Only present when threeDsStatus is "challenge". */
  challengeStatus?: ChallengeStatus;
};

const transactions = raw as Transaction[];

export function isThreeDsStatus(value: unknown): value is ThreeDsStatus {
  return THREE_DS_STATUSES.includes(value as ThreeDsStatus);
}

export type GetTransactionsOptions = {
  page?: number;
  pageSize?: number;
  status?: ThreeDsStatus;
};

export type TransactionsPage = {
  rows: Transaction[];
  total: number;
  page: number;
  pageCount: number;
};

export function getTransactions({
  page = 1,
  pageSize = 50,
  status,
}: GetTransactionsOptions = {}): TransactionsPage {
  const filtered = status
    ? transactions.filter((t) => t.threeDsStatus === status)
    : transactions;

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * pageSize;

  return {
    rows: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page: current,
    pageCount,
  };
}
