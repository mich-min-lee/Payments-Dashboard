import { useMemo } from "react"
import { Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { HealthIcon } from "@/components/health-badge"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatDay, formatPercent } from "@/lib/format"
import { HEALTH_TEXT, OUTCOME_LABELS } from "@/lib/labels"
import {
  MIN_SAMPLE,
  OUTCOME_THRESHOLDS,
  ROLLING_DAYS,
  merchantDetail,
  type MerchantDetail as Detail,
  type MerchantMetrics,
} from "@/lib/metrics"
import { mockBankFor } from "@/lib/mock-banks"
import { mockMerchantFor } from "@/lib/mock-merchants"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types"

/**
 * MVP, built from the ops interview: in a real incident they checked the bank split,
 * the count, and when it started, then acted. So: two lines and a small line.
 */
export function MerchantDetail({
  merchant,
  transactions,
}: {
  merchant: MerchantMetrics
  transactions: readonly Transaction[]
}) {
  // The most urgent problem; with none, Abandoned (ops' #1 metric).
  const key = merchant.issues[0]?.key ?? "abandoned"
  const detail = useMemo(
    () => merchantDetail(transactions, merchant.merchant, key, mockMerchantFor, mockBankFor),
    [transactions, merchant.merchant, key],
  )

  return (
    <div className="space-y-2 p-4">
      <BankLine detail={detail} />
      <CountLine detail={detail} />
      <Sparkline merchant={merchant.merchant} detail={detail} />
    </div>
  )
}

/** First, because it decides who ops contacts: one bank, or all of them? */
function BankLine({ detail }: { detail: Detail }) {
  const { verdict, worst, rest, range } = detail.banks
  const worstRate = worst && (
    <span className={cn("tabular-nums", worst.health && HEALTH_TEXT[worst.health])}>
      {formatPercent(worst.ratio.rate)}
    </span>
  )
  const restText = rest && `others around ${formatPercent(rest.rate)}`
  const rangeText = range && `${formatPercent(range[0])}–${formatPercent(range[1])}`

  return (
    <p className="flex flex-wrap items-center gap-x-2 text-base font-semibold">
      {verdict === "one-bank" && worst && (
        <>
          One bank: {worst.bank} at {worstRate}
          {restText && <span className="font-normal text-muted-foreground">· {restText}</span>}
        </>
      )}
      {verdict === "across-banks" && (
        <>
          Spread across all banks
          {rangeText && <span className="font-normal text-muted-foreground tabular-nums">({rangeText})</span>}
        </>
      )}
      {verdict === "unclear" && worst && (
        <>
          No clear bank pattern: worst is {worst.bank} at {worstRate}
          {restText && <span className="font-normal text-muted-foreground">· {restText}</span>}
        </>
      )}
      {verdict === "none" && "No bank stands out"}
      <Badge variant="outline" className="font-normal">
        Mock banks
      </Badge>
    </p>
  )
}

/** Second: is it real (volume), when did it start, is it still going? */
function CountLine({ detail }: { detail: Detail }) {
  const { overall, story, smallSample } = detail
  const status = {
    ongoing: story.onset && `started ${formatDay(story.onset)}, still going`,
    improving: story.onset && `started ${formatDay(story.onset)}, improving`,
    recovered: story.lastOff && `recovered after ${formatDay(story.lastOff)}`,
    healthy: "healthy all month",
  }[story.status]

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{OUTCOME_LABELS[detail.key]}</span>
      <span className={cn("font-semibold tabular-nums", overall.health && HEALTH_TEXT[overall.health])}>
        {formatPercent(overall.ratio.rate)}
      </span>
      {overall.health === "critical" && <HealthIcon health="critical" />}
      {overall.health === "warning" && <span className="sr-only">Warning</span>}
      <span>· {overall.ratio.total.toLocaleString()} trnx</span>
      {smallSample ? <span>· too few to tell yet (under {MIN_SAMPLE})</span> : <span>· {status}</span>}
    </p>
  )
}

/** Small on purpose: just enough to tell a cliff (something broke) from a slow climb (drift). */
function Sparkline({ merchant, detail }: { merchant: string; detail: Detail }) {
  const data = detail.trend.map((p) => ({
    day: formatDay(p.date),
    rate: p.ratio.rate === null ? null : Math.round(p.ratio.rate * 1000) / 10,
  }))
  const config = { rate: { label: OUTCOME_LABELS[detail.key], color: "var(--foreground)" } } satisfies ChartConfig
  const onsetDay = detail.story.onset && formatDay(detail.story.onset)

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-16 w-full max-w-md"
      role="img"
      aria-label={`${OUTCOME_LABELS[detail.key]} per day for ${merchant}, pooled over ${ROLLING_DAYS} days.`}
    >
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <XAxis dataKey="day" hide />
        <YAxis hide domain={[0, "auto"]} />
        <ReferenceLine y={OUTCOME_THRESHOLDS[detail.key].healthy * 100} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
        {onsetDay && <ReferenceLine x={onsetDay} stroke="var(--muted-foreground)" />}
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => <span className="font-medium tabular-nums">{String(value)}%</span>}
            />
          }
        />
        <Line dataKey="rate" stroke="var(--color-rate)" strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ChartContainer>
  )
}
