import { HealthBadge } from "@/components/health-badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  challengeOutcomes,
  HEALTH_THRESHOLDS,
  healthOf,
  threeDsOutcomes,
  threeDsRate,
  type Health,
  type Ratio,
} from "@/lib/metrics"
import type { Transaction } from "@/types"

interface Kpi {
  label: string
  ratio: Ratio
  /** What the rate is out of, e.g. "3DS transactions". */
  of: string
  health: Health | null
}

function formatPercent(rate: number | null) {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`
}

export function KpiCards({ transactions }: { transactions: readonly Transaction[] }) {
  const coverage = threeDsRate(transactions)
  const outcomes = threeDsOutcomes(transactions)
  const challenges = challengeOutcomes(transactions)

  const kpis: Kpi[] = [
    {
      label: "3DS rate",
      ratio: coverage,
      of: "transactions",
      health: null, // Coverage isn't good or bad on its own.
    },
    {
      label: "Frictionless",
      ratio: outcomes.frictionless,
      of: "3DS transactions",
      health: healthOf(outcomes.frictionless.rate, HEALTH_THRESHOLDS.frictionless),
    },
    {
      label: "Rejected",
      ratio: outcomes.rejected,
      of: "3DS transactions",
      health: healthOf(outcomes.rejected.rate, HEALTH_THRESHOLDS.rejection),
    },
    {
      label: "Challenge success",
      ratio: challenges.success,
      of: "challenges",
      health: healthOf(challenges.success.rate, HEALTH_THRESHOLDS.challengeSuccess),
    },
    {
      label: "Challenge abandoned",
      ratio: challenges.abandoned,
      of: "challenges",
      health: healthOf(challenges.abandoned.rate, HEALTH_THRESHOLDS.abandonment),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardHeader>
            <CardDescription>{kpi.label}</CardDescription>
            {kpi.health && (
              <CardAction>
                <HealthBadge health={kpi.health} />
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl tabular-nums">{formatPercent(kpi.ratio.rate)}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {kpi.ratio.count.toLocaleString()} of {kpi.ratio.total.toLocaleString()} {kpi.of}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
