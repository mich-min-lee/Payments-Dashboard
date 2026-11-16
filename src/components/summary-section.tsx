import { HealthBadge } from "@/components/health-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatChange, formatPercent } from "@/lib/format"
import type { Period, PeriodStat, PeriodSummary } from "@/lib/metrics"
import { cn } from "@/lib/utils"

export type SummaryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: PeriodSummary }

/** Null: this period has nothing to compare with. */
const COMPARED_WITH = {
  today: "vs yesterday",
  week: "vs last week",
  month: null,
} as const satisfies Record<Period, string | null>

// Normal segments are shades of gray; color appears only when health is off.
const NEUTRAL_SEGMENTS = ["bg-foreground/15", "bg-foreground/45", "bg-foreground/85"] as const
const OFF_SEGMENT = { warning: "bg-warning", critical: "bg-critical" } as const

interface Segment {
  label: string
  description: string
  stat: PeriodStat
}

export function SummarySection({ state }: { state: SummaryState }) {
  return (
    <section
      aria-label="Summary"
      aria-busy={state.status === "loading"}
      className="flex flex-wrap gap-x-10 gap-y-7 rounded-xl border bg-card p-6"
    >
      {state.status === "loading" && <SummarySkeleton />}
      {state.status === "error" && (
        <div role="alert" className="text-sm">
          <p className="font-medium text-critical">Couldn't load the summary</p>
          <p className="mt-1 text-muted-foreground">{state.message}</p>
        </div>
      )}
      {state.status === "ready" && <Summary summary={state.summary} />}
    </section>
  )
}

function Summary({ summary }: { summary: PeriodSummary }) {
  const { stats } = summary
  const comparedWith = COMPARED_WITH[summary.period]

  return (
    <>
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2.5">
        <h2 className="text-sm font-semibold">3DS rate</h2>
        <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
          {formatPercent(stats.threeDs.ratio.rate)}
        </p>
        <div className="flex flex-col items-start gap-1 text-[13px] text-muted-foreground tabular-nums">
          <span>
            <b className="font-semibold text-foreground">{stats.threeDs.ratio.count.toLocaleString()}</b>{" "}
            3DS transactions
          </span>
          <span aria-hidden className="w-full max-w-48 border-t border-foreground/40" />
          <span>
            <b className="font-semibold text-foreground">{stats.threeDs.ratio.total.toLocaleString()}</b>{" "}
            total transactions
          </span>
        </div>
        <Change stat={stats.threeDs} comparedWith={comparedWith} />
      </div>

      <OutcomeGroup
        title="3DS outcomes"
        basis={`Share of ${stats.threeDs.ratio.count.toLocaleString()} 3DS transactions`}
        comparedWith={comparedWith}
        segments={[
          { label: "Frictionless", description: "Authenticated with no customer action", stat: stats.frictionless },
          { label: "Challenge", description: "Issuer requested customer verification", stat: stats.challenge },
          { label: "Rejection", description: "Authentication declined by issuer", stat: stats.rejected },
        ]}
      />

      <OutcomeGroup
        title="Challenge outcomes"
        basis={`Share of ${stats.challenge.ratio.count.toLocaleString()} challenges`}
        comparedWith={comparedWith}
        segments={[
          { label: "Success", description: "Customer completed verification", stat: stats.success },
          { label: "Failed", description: "Customer did not pass verification", stat: stats.failed },
          { label: "Abandoned", description: "Customer exited before completing", stat: stats.abandoned },
        ]}
      />
    </>
  )
}

function OutcomeGroup({
  title,
  basis,
  segments,
  comparedWith,
}: {
  title: string
  basis: string
  segments: Segment[]
  comparedWith: string | null
}) {
  const colorOf = (segment: Segment, index: number) => {
    const { health } = segment.stat
    return health === "warning" || health === "critical" ? OFF_SEGMENT[health] : NEUTRAL_SEGMENTS[index]
  }

  return (
    <div className="flex min-w-0 flex-[2_1_360px] flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{basis}</span>
      </div>

      {/* The bar repeats the legend's numbers, so screen readers get one summary line. */}
      <div
        role="img"
        aria-label={`${title}: ${segments.map((s) => `${s.label} ${formatPercent(s.stat.ratio.rate)}`).join(", ")}`}
        className="flex h-4 gap-0.5"
      >
        {segments.map((segment, i) => (
          <div
            key={segment.label}
            className={cn("rounded-[3px]", colorOf(segment, i))}
            style={{ width: `${(segment.stat.ratio.rate ?? 0) * 100}%` }}
          />
        ))}
      </div>

      <ul role="list" className="grid grid-cols-3 gap-3.5">
        {segments.map((segment, i) => (
          <li key={segment.label} className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span aria-hidden className={cn("size-2.5 flex-none rounded-[2px]", colorOf(segment, i))} />
              <span className="text-[13px] font-medium">{segment.label}</span>
              {/* Loud only when off: healthy shows no badge. */}
              {segment.stat.health && segment.stat.health !== "healthy" && (
                <HealthBadge health={segment.stat.health} />
              )}
            </div>
            <span className="text-[22px] font-semibold tabular-nums">{formatPercent(segment.stat.ratio.rate)}</span>
            <span className="text-xs text-muted-foreground">{segment.description}</span>
            <Change stat={segment.stat} comparedWith={comparedWith} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Change({ stat, comparedWith }: { stat: PeriodStat; comparedWith: string | null }) {
  if (comparedWith === null) return null
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {stat.change === null ? `No data ${comparedWith}` : formatChange(stat.change, comparedWith)}
    </span>
  )
}

function SummarySkeleton() {
  return (
    <>
      <div className="flex flex-[1_1_220px] flex-col gap-3" aria-label="Loading summary">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-12 w-44" />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-[2_1_360px] flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-3 gap-3.5">
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-20" />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
