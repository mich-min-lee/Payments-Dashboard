import { HealthBadge } from "@/components/health-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPercent } from "@/lib/format"
import type { PeriodStat, PeriodSummary } from "@/lib/metrics"
import { cn } from "@/lib/utils"

export type SummaryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: PeriodSummary }

// Normal segments are shades of gray; color appears only when health is off.
const NEUTRAL_SEGMENTS = ["bg-foreground/15", "bg-foreground/45", "bg-foreground/85"] as const
const OFF_SEGMENT = { warning: "bg-warning", critical: "bg-critical" } as const
const OFF_TEXT = { warning: "text-warning", critical: "text-critical" } as const

type OffSegment = Segment & { stat: { health: "warning" | "critical" } }

/** Warning or critical: the only states that get color. */
function isOff(segment: Segment): segment is OffSegment {
  return segment.stat.health === "warning" || segment.stat.health === "critical"
}

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

  return (
    <>
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2.5">
        <h2 className="text-sm font-semibold">3DS rate</h2>
        <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
          {formatPercent(stats.threeDs.ratio.rate)}
        </p>
        <div className="flex w-fit flex-col gap-1 text-[13px] text-muted-foreground tabular-nums">
          <span>
            <b className="font-semibold text-foreground">{stats.threeDs.ratio.count.toLocaleString()}</b>{" "}
            3DS transactions
          </span>
          <span aria-hidden className="border-t border-foreground/40" />
          <span>
            <b className="font-semibold text-foreground">{stats.threeDs.ratio.total.toLocaleString()}</b>{" "}
            Total transactions
          </span>
        </div>
      </div>

      <OutcomeGroup
        title="3DS outcomes"
        basis={`Share of ${stats.threeDs.ratio.count.toLocaleString()} 3DS transactions`}
        totalUnit="3DS trnx"
        segments={[
          { label: "Frictionless", description: "Approved with no extra step", stat: stats.frictionless },
          { label: "Challenge", description: "Bank asked customer to verify", stat: stats.challenge },
          { label: "Rejection", description: "Declined by the bank", stat: stats.rejected },
        ]}
      />

      <OutcomeGroup
        title="Challenge outcomes"
        basis={`Share of ${stats.challenge.ratio.count.toLocaleString()} challenges`}
        totalUnit="challenged trnx"
        segments={[
          { label: "Success", description: "Customer verified", stat: stats.success },
          { label: "Failed", description: "Customer couldn't verify", stat: stats.failed },
          { label: "Abandoned", description: "Customer quit midway", stat: stats.abandoned },
        ]}
      />
    </>
  )
}

function OutcomeGroup({
  title,
  basis,
  totalUnit,
  segments,
}: {
  title: string
  basis: string
  /** What every segment divides by, e.g. "3DS trnx". */
  totalUnit: string
  segments: Segment[]
}) {
  const colorOf = (segment: Segment, index: number) =>
    isOff(segment) ? OFF_SEGMENT[segment.stat.health] : NEUTRAL_SEGMENTS[index]
  const offText = (segment: Segment) => (isOff(segment) ? OFF_TEXT[segment.stat.health] : undefined)

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
            </div>
            {/* Always 2 lines tall, so the percentages line up across the row. */}
            <span className="line-clamp-2 min-h-[2lh] text-xs text-muted-foreground">{segment.description}</span>
            <span className={cn("mt-1 text-[22px] font-semibold tabular-nums", offText(segment))}>
              {formatPercent(segment.stat.ratio.rate)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {segment.stat.ratio.count.toLocaleString()} trnx /{" "}
              {segment.stat.ratio.total.toLocaleString()} {totalUnit}
            </span>
            {/* Loud only when off. The badge is the text label that goes with the colored number. */}
            {isOff(segment) && (
              <div className="mt-1">
                <HealthBadge health={segment.stat.health} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
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
