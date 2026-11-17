import type { Health, OutcomeKey } from "@/lib/metrics"

export const OUTCOME_LABELS: Record<OutcomeKey, string> = {
  frictionless: "Frictionless",
  challenge: "Challenge",
  rejected: "Rejection",
  success: "Success",
  failed: "Failed",
  abandoned: "Abandoned",
}

/** Color only for warning / critical; healthy stays plain. */
export const HEALTH_TEXT: Partial<Record<Health, string>> = {
  warning: "text-warning",
  critical: "text-critical",
}

export const HEALTH_LABELS: Record<Health, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
}
