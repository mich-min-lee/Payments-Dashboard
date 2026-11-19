import { BadgeCheck, Clock, Lock, Route, ShieldCheck, Zap, type LucideIcon } from "lucide-react"

/**
 * Trust signals shown in the hero. All are Coinflow's own published
 * claims (coinflow.cash, Nov 2026).
 */
export interface ProofPoint {
  label: string
  icon: LucideIcon
}

/** "Your money moves fast." */
export const SPEED_POINTS: readonly ProofPoint[] = [
  { label: "T+5 sec card settlement", icon: Zap },
  { label: "24/7/365 payouts", icon: Clock },
  { label: "Smart routing", icon: Route },
]

/** "You can trust us with card data." */
export const COMPLIANCE_POINTS: readonly ProofPoint[] = [
  { label: "PCI DSS L1", icon: ShieldCheck },
  { label: "SOC 2", icon: BadgeCheck },
  { label: "3DS", icon: Lock },
]
