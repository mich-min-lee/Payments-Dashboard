import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { HealthIcon } from "@/components/health-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPercent } from "@/lib/format"
import type { PeriodStat, PeriodSummary } from "@/lib/metrics"
import { cn } from "@/lib/utils"

export type SummaryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; summary: PeriodSummary }

// Normal segments are shades of gray; color appears only when health is off.
// Light gray: 3.1:1 on white. Mid gray: 3.3:1 from light gray. The near-black third
// piece (only when the last segment is healthy) is separated by the 2px gaps.
const NEUTRAL_SEGMENTS = ["bg-foreground/45", "bg-foreground/[0.78]", "bg-foreground"] as const
const OFF_SEGMENT = { warning: "bg-warning", critical: "bg-critical" } as const
const OFF_TEXT = { warning: "text-warning", critical: "text-critical" } as const

// Lines a nested block up with the 2nd of 3 grid columns (gap-3.5 = 0.875rem):
// one column width plus one gap.
const UNDER_SECOND_COLUMN = "md:ml-[calc((100%-1.75rem)/3+0.875rem)]"

interface Segment {
  label: string
  description: string
  stat: PeriodStat
}

type OffSegment = Segment & { stat: { health: "warning" | "critical" } }

/** Warning or critical: the only states that get color. */
function isOff(segment: Segment): segment is OffSegment {
  return segment.stat.health === "warning" || segment.stat.health === "critical"
}

export function SummarySection({ state }: { state: SummaryState }) {
  return (
    <Card role="region" aria-label="Summary" aria-busy={state.status === "loading"}>
      {/* flex-row overrides CardContent's default flex-col; in a column, the children's flex-basis
          (200px / 440px) would become minimum heights and the card couldn't shrink when the
          challenge breakdown collapses. */}
      <CardContent className="flex-row flex-wrap gap-x-10 gap-y-7">
        {state.status === "loading" && <SummarySkeleton />}
        {state.status === "error" && (
          <Alert variant="destructive">
            <AlertTitle>Couldn't load the summary</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        {/* Keyed by period, so the challenge section re-decides open/closed when the period changes. */}
        {state.status === "ready" && <Summary key={state.summary.period} summary={state.summary} />}
      </CardContent>
    </Card>
  )
}

function Summary({ summary }: { summary: PeriodSummary }) {
  const { stats } = summary

  const challengeSegments: Segment[] = [
    { label: "Success", description: "Customer verified", stat: stats.success },
    { label: "Failed", description: "Customer couldn't verify", stat: stats.failed },
    { label: "Abandoned", description: "Customer quit midway", stat: stats.abandoned },
  ]
  const offSegments = challengeSegments.filter(isOff)
  const offCount = offSegments.length
  // The most serious status among them decides the color of the "Needs Attention" text.
  const worst = offSegments.some((s) => s.stat.health === "critical") ? "critical" : "warning"

  // Open by default only when something needs attention (Abandoned is ops' #1 metric).
  const [challengeOpen, setChallengeOpen] = useState(offCount > 0)

  // The only control for the section: its own header. Closed, it also carries the status.
  // The status text stays in the button when open, just invisible, so the click target is
  // exactly the same size and spot open or closed. "Out of" sits outside the button.
  const challengeToggle = (
    <h2>
      <CollapsibleTrigger
        // No hover box: the title darkens and the chevron nudges toward where it opens.
        // Keyboard focus still gets a visible outline.
        className="group -mx-2 -my-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 flex-none text-muted-foreground transition-[rotate,translate,color] duration-300 ease-in-out group-hover:text-foreground motion-reduce:transition-none",
            challengeOpen ? "group-hover:translate-y-0.5" : "-rotate-90 group-hover:translate-x-0.5",
          )}
        />
        <span className="font-semibold text-foreground/80 transition-colors duration-300 ease-in-out group-hover:text-foreground">
          Challenge outcomes
        </span>
        <span className={cn("flex items-center gap-1", challengeOpen && "invisible")}>
          {offCount === 0 ? (
            <span className="text-muted-foreground">· All healthy</span>
          ) : (
            <span className={cn("flex items-center gap-1 font-medium", OFF_TEXT[worst])}>
              · Needs Attention
              {/* No tooltip here: it's inside a button, and the text already says it. */}
              {worst === "critical" && <HealthIcon health="critical" tooltip={false} />}
            </span>
          )}
        </span>
      </CollapsibleTrigger>
    </h2>
  )

  return (
    <>
      <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-2.5">
        <h2 className="text-sm font-semibold">3DS rate</h2>
        <p className="text-4xl leading-none font-semibold tracking-tight tabular-nums">
          {formatPercent(stats.threeDs.ratio.rate)}
        </p>
        {/* The 3DS rate has no "Out of" header, so it spells out both counts. */}
        <p className="text-[15px] text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground/75">{stats.threeDs.ratio.count.toLocaleString()} 3DS trnx</span>{" "}
          out of {stats.threeDs.ratio.total.toLocaleString()} total trnx
        </p>
      </div>

      <div className="flex min-w-0 flex-[3_1_440px] flex-col gap-5">
        <OutcomeGroup
          title="3DS outcomes"
          baseCount={stats.threeDs.ratio.count}
          totalUnit="3DS trnx"
          segments={[
            { label: "Frictionless", description: "Approved with no extra step", stat: stats.frictionless },
            { label: "Challenge", description: "Bank asked customer to verify", stat: stats.challenge },
            { label: "Rejection", description: "Declined by the bank", stat: stats.rejected },
          ]}
        />

        {/* Nested under the Challenge column: these outcomes are a breakdown of Challenge. */}
        <Collapsible
          open={challengeOpen}
          onOpenChange={setChallengeOpen}
          className={cn("border-l-2 pl-4", UNDER_SECOND_COLUMN)}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            {challengeToggle}
            <span
              aria-hidden={!challengeOpen}
              className={cn(
                "transition-opacity duration-300 ease-in-out motion-reduce:transition-none",
                !challengeOpen && "opacity-0",
              )}
            >
              <Basis count={stats.challenge.ratio.count} unit="challenged trnx" />
            </span>
          </div>

          {/* Radix measures the content's height; tw-animate-css slides between 0 and it. */}
          <CollapsibleContent className="overflow-hidden duration-300 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none">
            <div className="pt-3">
              <OutcomeGroup
                title="Challenge outcomes"
                heading={null}
                baseCount={stats.challenge.ratio.count}
                totalUnit="challenged trnx"
                segments={challengeSegments}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  )
}

function OutcomeGroup({
  title,
  heading,
  baseCount,
  totalUnit,
  segments,
}: {
  /** Used for the bar's screen-reader label, and as the heading unless `heading` is given. */
  title: string
  /** Replaces the whole header row (title + "Out of"). `null` hides it. */
  heading?: ReactNode
  /** How many transactions every segment divides by. */
  baseCount: number
  /** What every segment divides by, e.g. "3DS trnx". */
  totalUnit: string
  segments: Segment[]
}) {
  const colorOf = (segment: Segment, index: number) =>
    isOff(segment) ? OFF_SEGMENT[segment.stat.health] : NEUTRAL_SEGMENTS[index]
  const offText = (segment: Segment) => (isOff(segment) ? OFF_TEXT[segment.stat.health] : undefined)

  // Which segment is hovered (bar piece or legend item). The others fade back.
  const [active, setActive] = useState<number | null>(null)
  const dimmed = (i: number) => active !== null && active !== i
  const hoverProps = (i: number) => ({
    onMouseEnter: () => setActive(i),
    onMouseLeave: () => setActive(null),
  })

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {heading !== undefined ? heading : (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          <Basis count={baseCount} unit={totalUnit} />
        </div>
      )}

      {/* The bar repeats the legend's numbers, so screen readers get one summary line. */}
      <div
        role="img"
        aria-label={`${title}: ${segments.map((s) => `${s.label} ${formatPercent(s.stat.ratio.rate)}`).join(", ")}`}
        className="flex h-4 gap-0.5"
      >
        {segments.map((segment, i) => (
          <div
            key={segment.label}
            {...hoverProps(i)}
            className={cn(
              "rounded-[3px] transition-opacity duration-300 ease-in-out",
              colorOf(segment, i),
              dimmed(i) && "opacity-30",
            )}
            style={{ width: `${(segment.stat.ratio.rate ?? 0) * 100}%` }}
          />
        ))}
      </div>

      <ul role="list" className="grid grid-cols-3 gap-3.5">
        {segments.map((segment, i) => (
          <li
            key={segment.label}
            {...hoverProps(i)}
            className={cn(
              "flex min-w-0 flex-col gap-0.5 transition-opacity duration-300 ease-in-out",
              dimmed(i) && "opacity-40",
            )}
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span aria-hidden className={cn("size-2.5 flex-none rounded-[2px]", colorOf(segment, i))} />
              <span className="text-[13px] font-medium">{segment.label}</span>
            </div>
            {/* Always 2 lines tall, so the percentages line up across the row. */}
            <span className="line-clamp-2 min-h-[2lh] text-xs text-muted-foreground">{segment.description}</span>
            {/* Status icon sits right beside its number. */}
            <div className="mt-1 flex items-center gap-1.5">
              <span className={cn("text-[22px] font-semibold tabular-nums", offText(segment))}>
                {formatPercent(segment.stat.ratio.rate)}
              </span>
              {/* Critical gets an alert icon; warning is shown by the amber number alone
                  (design decision). Screen readers hear the word either way. */}
              {segment.stat.health === "critical" && <HealthIcon health="critical" />}
              {segment.stat.health === "warning" && <span className="sr-only">Warning</span>}
            </div>
            {/* Just the volume: the header already says what it's out of. */}
            <span className="text-xs font-semibold text-foreground/75 tabular-nums">
              {segment.stat.ratio.count.toLocaleString()} trnx
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** "Out of 166 3DS trnx": what every segment in a group divides by. */
function Basis({ count, unit }: { count: number; unit: string }) {
  return (
    <span className="text-xs text-foreground/75">
      Out of{" "}
      <b className="font-semibold">
        {count.toLocaleString()} {unit}
      </b>
    </span>
  )
}

function SummarySkeleton() {
  const group = (className?: string) => (
    <div className={cn("flex flex-col gap-3", className)}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-full" />
      <div className="grid grid-cols-3 gap-3.5">
        {[0, 1, 2].map((j) => (
          <Skeleton key={j} className="h-20" />
        ))}
      </div>
    </div>
  )
  return (
    <>
      <div className="flex flex-[1_1_200px] flex-col gap-3" aria-label="Loading summary">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-12 w-44" />
      </div>
      <div className="flex flex-[3_1_440px] flex-col gap-5">
        {group()}
        {group(cn("pl-4", UNDER_SECOND_COLUMN))}
      </div>
    </>
  )
}
