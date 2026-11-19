import { Fragment, createContext, useContext, useMemo, useState } from "react"
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, ChevronRight, Search } from "lucide-react"
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { HealthIcon } from "@/components/health-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPercent } from "@/lib/format"
import { HEALTH_TEXT, OUTCOME_LABELS } from "@/lib/labels"
import { merchantMetrics, type FunnelStat, type MerchantMetrics, type Ratio } from "@/lib/metrics"
import { mockMerchantFor } from "@/lib/mock-merchants"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/types"

// Module level so the table doesn't rebuild these on every render.
const features = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
})

const helper = createColumnHelper<typeof features, MerchantMetrics>()

/** First column inside "3DS outcomes": draws the group's left edge. */
const GROUP_START_COLUMN = "frictionless"
const COLUMN_COUNT = 5

/** Sort by the rate; merchants with no rate go last. */
const rateOf = (ratio: Ratio) => ratio.rate ?? undefined

const detailRowId = (merchant: string) => `detail-${merchant.replace(/\W+/g, "-").toLowerCase()}`

/** Which merchant is expanded. Context, so the columns can stay static. */
const ExpandContext = createContext<{
  expanded: string | null
  toggle: (merchant: string) => void
}>({
  expanded: null,
  toggle: () => {},
})

const columns = helper.columns([
  helper.accessor("merchant", {
    header: "Merchant",
    sortFn: "text",
    filterFn: "includesString",
    cell: (info) => <MerchantCell merchant={info.row.original} />,
  }),
  helper.accessor((row) => rateOf(row.threeDsRate), {
    id: "threeDsRate",
    header: "3DS rate",
    sortUndefined: "last",
    cell: (info) => {
      const { count, total, rate } = info.row.original.threeDsRate
      return (
        <div>
          <span className="tabular-nums">{formatPercent(rate)}</span>
          <div className="text-xs text-muted-foreground tabular-nums">
            {count.toLocaleString()} 3DS trnx / {total.toLocaleString()} total trnx
          </div>
        </div>
      )
    },
  }),
  helper.group({
    id: "threeDsOutcomes",
    header: "3DS outcomes",
    columns: helper.columns([
      // Same order as the summary: best to worst outcome.
      helper.accessor((row) => rateOf(row.threeDsOutcomes.frictionless), {
        id: "frictionless",
        header: "Frictionless",
        sortUndefined: "last",
        cell: (info) => <RateCell stat={info.row.original.funnel.frictionless} />,
      }),
      helper.accessor((row) => rateOf(row.threeDsOutcomes.challenge), {
        id: "challenge",
        header: "Challenge",
        sortUndefined: "last",
        cell: (info) => <ChallengeCell merchant={info.row.original} />,
      }),
      helper.accessor((row) => rateOf(row.threeDsOutcomes.rejected), {
        id: "rejected",
        header: "Rejection",
        sortUndefined: "last",
        cell: (info) => <RateCell stat={info.row.original.funnel.rejected} />,
      }),
    ]),
  }),
])

/**
 * The expand control, plus what's off for this merchant, so the table itself
 * prompts the "wait, what's that?" click (including off challenge outcomes,
 * which have no column of their own).
 */
function MerchantCell({ merchant }: { merchant: MerchantMetrics }) {
  const { expanded, toggle } = useContext(ExpandContext)
  const isOpen = expanded === merchant.merchant
  const [worst, ...rest] = merchant.issues

  return (
    <div className="flex items-start gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        className="-ml-2"
        onClick={() => toggle(merchant.merchant)}
        aria-expanded={isOpen}
        aria-controls={isOpen ? detailRowId(merchant.merchant) : undefined}
        aria-label={`${isOpen ? "Hide" : "Show"} details for ${merchant.merchant}`}
      >
        <ChevronRight aria-hidden className={cn("transition-transform duration-300", isOpen && "rotate-90")} />
      </Button>
      <div className="pt-1.5">
        <span className="font-medium">{merchant.merchant}</span>
        {worst && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", HEALTH_TEXT[worst.health])}>
            {OUTCOME_LABELS[worst.key]} {formatPercent(worst.ratio.rate)}
            {worst.health === "critical" && <HealthIcon health="critical" tooltip={false} />}
            {worst.health === "warning" && <span className="sr-only">Warning</span>}
            {rest.length > 0 && <span className="font-normal text-muted-foreground">+{rest.length} more</span>}
          </div>
        )}
      </div>
    </div>
  )
}

/** A rate colored by its health (plain when healthy), with its volume. */
function RateCell({ stat }: { stat: FunnelStat }) {
  return (
    <div>
      <RateValue stat={stat} />
      <div className="text-xs text-muted-foreground tabular-nums">{stat.ratio.count.toLocaleString()} trnx</div>
    </div>
  )
}

function RateValue({ stat, tooltip = true }: { stat: FunnelStat; tooltip?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", stat.health && HEALTH_TEXT[stat.health])}>
      {formatPercent(stat.ratio.rate)}
      {stat.health === "critical" && <HealthIcon health="critical" tooltip={tooltip} />}
      {stat.health === "warning" && <span className="sr-only">Warning</span>}
    </span>
  )
}

/**
 * Hover previews the challenge outcomes. Clicking (or Enter for keyboard users)
 * expands the merchant's details, since hover cards don't open from the keyboard.
 */
function ChallengeCell({ merchant }: { merchant: MerchantMetrics }) {
  const { expanded, toggle } = useContext(ExpandContext)
  const open = () => {
    if (expanded !== merchant.merchant) toggle(merchant.merchant)
  }
  const challenge = merchant.funnel.challenge
  const outcomes = [
    ["Success", merchant.funnel.success],
    ["Failure", merchant.funnel.failed],
    ["Abandonment", merchant.funnel.abandoned],
  ] as const

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={open}
          className="-mx-1 rounded px-1 text-left underline decoration-dotted underline-offset-4 hover:bg-muted"
          aria-label={`Challenge ${formatPercent(challenge.ratio.rate)}. Show details for ${merchant.merchant}`}
        >
          {/* No tooltip: it's inside a button. */}
          <RateValue stat={challenge} tooltip={false} />
          <div className="text-xs text-muted-foreground tabular-nums">
            {challenge.ratio.count.toLocaleString()} trnx
          </div>
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64">
        <p className="mb-2 text-sm font-medium">Challenge outcomes</p>
        <dl className="space-y-1 text-sm">
          {outcomes.map(([label, stat]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>
                <RateValue stat={stat} />
              </dd>
            </div>
          ))}
        </dl>
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={open}>
          Show details
          <ArrowRight aria-hidden />
        </Button>
      </HoverCardContent>
    </HoverCard>
  )
}

export function MerchantTable({ transactions }: { transactions: readonly Transaction[] }) {
  const data = useMemo(() => merchantMetrics(transactions, mockMerchantFor), [transactions])
  const table = useTable({ features, columns, data })

  // One merchant at a time, so the detail always sits right under its row.
  const [expanded, setExpanded] = useState<string | null>(null)
  const expand = useMemo(
    () => ({
      expanded,
      toggle: (merchant: string) => setExpanded((current) => (current === merchant ? null : merchant)),
    }),
    [expanded],
  )

  const merchantColumn = table.getColumn("merchant")
  const search = String(merchantColumn?.getFilterValue() ?? "")
  const rows = table.getRowModel().rows

  return (
    <ExpandContext.Provider value={expand}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Merchants</h2>
            <Badge variant="outline">Mock data</Badge>
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search merchants"
              aria-label="Search merchants"
              className="pl-8"
              value={search}
              onChange={(event) => merchantColumn?.setFilterValue(event.target.value || undefined)}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          The dataset has no merchants or banks. Real transactions are split across made-up merchants and banks, skewed
          on purpose so some look unhealthy.
        </p>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group, i, groups) => (
              // Only the last header row gets a full-width bottom border.
              <TableRow
                key={group.id}
                className={i < groups.length - 1 ? "border-b-0! hover:bg-transparent" : undefined}
              >
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        header.colSpan > 1 && "border-b border-l text-center",
                        header.column.id === GROUP_START_COLUMN && "border-l",
                      )}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUp aria-hidden />
                          ) : sorted === "desc" ? (
                            <ArrowDown aria-hidden />
                          ) : (
                            <ArrowUpDown aria-hidden className="opacity-40" />
                          )}
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="h-20 text-center text-muted-foreground">
                  No merchants match "{search}".
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isOpen = row.original.merchant === expanded
                return (
                  <Fragment key={row.id}>
                    <TableRow data-state={isOpen ? "selected" : undefined}>
                      {row.getAllCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn("align-top", cell.column.id === GROUP_START_COLUMN && "border-l")}
                        >
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                    {isOpen && (
                      // Full width, right under its merchant: the table never narrows.
                      <TableRow className="hover:bg-transparent">
                        {/* Left blank on purpose until ops tells us what they need to see here. */}
                        <TableCell
                          id={detailRowId(row.original.merchant)}
                          colSpan={COLUMN_COUNT}
                          className="h-24 bg-muted/30 p-0"
                        />
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </ExpandContext.Provider>
  )
}
