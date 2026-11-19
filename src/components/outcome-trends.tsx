import { useMemo } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { describeThreshold, formatDay, formatPercent, formatPercentWhole } from "@/lib/format"
import { HEALTH_LABELS, HEALTH_TEXT, OUTCOME_LABELS } from "@/lib/labels"
import {
  OUTCOME_THRESHOLDS,
  TREND_KEYS,
  dailyTrends,
  trendCeiling,
  type Health,
  type TrendKey,
  type TrendPoint,
} from "@/lib/metrics"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types"

/** One day as Recharts sees it. */
interface Row {
  date: string
  rate: number | null
  count: number
  total: number
  health: Health | null
}

// Off days get a status-colored dot; the tooltip still says the word, so color is never alone.
const OFF_DAY_FILL = {
  warning: "var(--warning)",
  critical: "var(--critical)",
} as const

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 }

/**
 * Daily 3DS outcome rates as three small charts, one per outcome. Each gets its own
 * y-axis: rejection sits near 10% and frictionless near 60%, so one shared axis would
 * flatten rejection into a line along the bottom.
 */
export function OutcomeTrends({
  transactions,
  dates,
}: {
  transactions: readonly Transaction[]
  dates: readonly string[]
}) {
  const trends = useMemo(() => dailyTrends(transactions, dates), [transactions, dates])
  return (
    // Three across only when each chart gets ~300px; stacked full width below that.
    <div className="grid gap-4 xl:grid-cols-3">
      {TREND_KEYS.map((key) => (
        <TrendPanel key={key} outcome={key} points={trends[key]} />
      ))}
    </div>
  )
}

function TrendPanel({ outcome, points }: { outcome: TrendKey; points: TrendPoint[] }) {
  const threshold = OUTCOME_THRESHOLDS[outcome]
  const label = OUTCOME_LABELS[outcome]
  const ceiling = trendCeiling(points, threshold)
  const rows: Row[] = points.map((p) => ({
    date: p.date,
    health: p.health,
    ...p.ratio,
  }))
  // Ticks at the thresholds themselves, so the axis reads "where does bad start?".
  const ticks = [0, threshold.healthy, threshold.critical, ceiling].sort((a, b) => a - b)
  const config = {
    rate: { label, color: "var(--chart-2)" },
  } satisfies ChartConfig

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{describeThreshold(threshold)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="aspect-auto h-44 w-full"
          role="img"
          aria-label={`${label} rate per day. ${describeThreshold(threshold)}. The table view has the same numbers.`}
        >
          <LineChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={AXIS_TICK}
            />
            <YAxis
              domain={[0, ceiling]}
              ticks={ticks}
              tickFormatter={formatPercentWhole}
              tickLine={false}
              axisLine={false}
              width={36}
              tick={AXIS_TICK}
            />
            <ThresholdLine y={threshold.healthy} label="Healthy" />
            <ThresholdLine y={threshold.critical} label="Critical" />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={({ active, payload }) => {
                const row: unknown = payload?.[0]?.payload
                return active && isRow(row) ? <DayTooltip row={row} /> : null
              }}
            />
            <Line
              dataKey="rate"
              stroke="var(--color-rate)"
              strokeWidth={2}
              dot={OffDayDot}
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Dashed and muted: a guide to read against, not data. The word says which line it is. */
function ThresholdLine({ y, label }: { y: number; label: string }) {
  return (
    <ReferenceLine
      y={y}
      stroke="var(--muted-foreground)"
      strokeOpacity={0.6}
      strokeDasharray="4 4"
      label={{
        value: label,
        position: "insideTopRight",
        fill: "var(--muted-foreground)",
        fontSize: 11,
      }}
    />
  )
}

function OffDayDot({ cx, cy, payload }: { cx?: number; cy?: number; payload?: unknown }) {
  if (cx === undefined || cy === undefined || !isRow(payload)) return null
  if (payload.health !== "warning" && payload.health !== "critical") return null
  // A ring in the card color separates the dot from the line it sits on.
  return <circle cx={cx} cy={cy} r={4} fill={OFF_DAY_FILL[payload.health]} stroke="var(--card)" strokeWidth={2} />
}

function DayTooltip({ row }: { row: Row }) {
  return (
    <div className="grid min-w-36 gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <span className="font-medium">{formatDay(row.date)}</span>
      <span className="flex items-center gap-2">
        <span className={cn("font-semibold tabular-nums", row.health && HEALTH_TEXT[row.health])}>
          {formatPercent(row.rate)}
        </span>
        {row.health && row.health !== "healthy" && <Badge variant="outline">{HEALTH_LABELS[row.health]}</Badge>}
      </span>
      <span className="text-muted-foreground tabular-nums">
        {row.count.toLocaleString()} of {row.total.toLocaleString()} 3DS trnx
      </span>
    </div>
  )
}

/** Recharts hands back our rows untyped; check the shape before trusting it. */
function isRow(value: unknown): value is Row {
  return typeof value === "object" && value !== null && "date" in value && "total" in value && "health" in value
}
