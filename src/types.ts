export const THREE_DS_STATUSES = ["challenge", "rejected", "frictionless"] as const
export type ThreeDsStatus = (typeof THREE_DS_STATUSES)[number]

export const CHALLENGE_STATUSES = ["success", "failed", "abandoned"] as const
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number]

export interface Transaction {
  id: string
  /** "YYYY-MM-DD" */
  date: string
  /** Missing means the transaction didn't go through 3DS. */
  threeDsStatus?: ThreeDsStatus
  /** Only present when threeDsStatus is "challenge". */
  challengeStatus?: ChallengeStatus
}
