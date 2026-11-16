import { useMemo, useState } from "react"
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, Search } from "lucide-react"
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
import { ChallengeOutcomesSheet } from "@/components/challenge-outcomes-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPercent } from "@/lib/format"
import { merchantMetrics, type MerchantMetrics, type Ratio } from "@/lib/metrics"
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
const GROUP_START_COLUMN = "challenge"

/** Sort by the rate; merchants with no rate go last. */
const rateOf = (ratio: Ratio) => ratio.rate ?? undefined

function makeColumns(openDetails: (merchant: MerchantMetrics) => void) {
  return helper.columns([
    helper.accessor("merchant", {
      header: "Merchant",
      sortFn: "text",
      filterFn: "includesString",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
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
              3DS ÷ all · {count.toLocaleString()} / {total.toLocaleString()}
            </div>
          </div>
        )
      },
    }),
    helper.group({
      id: "threeDsOutcomes",
      header: "3DS outcomes",
      columns: helper.columns([
        helper.accessor((row) => rateOf(row.threeDsOutcomes.challenge), {
          id: "challenge",
          header: "Challenge",
          sortUndefined: "last",
          cell: (info) => (
            <ChallengeCell merchant={info.row.original} onOpen={openDetails} />
          ),
        }),
        helper.accessor((row) => rateOf(row.threeDsOutcomes.rejected), {
          id: "rejected",
          header: "Rejection",
          sortUndefined: "last",
          cell: (info) => <RatioCell ratio={info.row.original.threeDsOutcomes.rejected} />,
        }),
        helper.accessor((row) => rateOf(row.threeDsOutcomes.frictionless), {
          id: "frictionless",
          header: "Frictionless",
          sortUndefined: "last",
          cell: (info) => <RatioCell ratio={info.row.original.threeDsOutcomes.frictionless} />,
        }),
      ]),
    }),
  ])
}

function RatioCell({ ratio }: { ratio: Ratio }) {
  return (
    <div>
      <span className="tabular-nums">{formatPercent(ratio.rate)}</span>
      <div className="text-xs text-muted-foreground tabular-nums">{ratio.count.toLocaleString()}</div>
    </div>
  )
}

/**
 * Hover previews the challenge outcomes. Clicking (or Enter for keyboard users)
 * opens the side panel directly, since hover cards don't open from the keyboard.
 */
function ChallengeCell({
  merchant,
  onOpen,
}: {
  merchant: MerchantMetrics
  onOpen: (merchant: MerchantMetrics) => void
}) {
  const challenge = merchant.threeDsOutcomes.challenge
  const outcomes = merchant.challengeOutcomes

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={() => onOpen(merchant)}
          className="-mx-1 rounded px-1 text-left underline decoration-dotted underline-offset-4 hover:bg-muted"
          aria-label={`Challenge ${formatPercent(challenge.rate)}. Open challenge outcomes for ${merchant.merchant}`}
        >
          <span className="tabular-nums">{formatPercent(challenge.rate)}</span>
          <div className="text-xs text-muted-foreground tabular-nums">
            {challenge.count.toLocaleString()}
          </div>
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64">
        <p className="mb-2 text-sm font-medium">Challenge outcomes</p>
        <dl className="space-y-1 text-sm">
          {(
            [
              ["Success", outcomes.success],
              ["Failure", outcomes.failed],
              ["Abandonment", outcomes.abandoned],
            ] as const
          ).map(([label, ratio]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="tabular-nums">{formatPercent(ratio.rate)}</dd>
            </div>
          ))}
        </dl>
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => onOpen(merchant)}>
          Daily breakdown
          <ArrowRight aria-hidden />
        </Button>
      </HoverCardContent>
    </HoverCard>
  )
}

export function MerchantTable({ transactions }: { transactions: readonly Transaction[] }) {
  const data = useMemo(
    () => merchantMetrics(transactions, (t) => mockMerchantFor(t)),
    [transactions],
  )
  const [selected, setSelected] = useState<MerchantMetrics | null>(null)
  // setSelected never changes, so the columns are built once.
  const columns = useMemo(() => makeColumns(setSelected), [])
  const table = useTable({ features, columns, data })

  const merchantColumn = table.getColumn("merchant")
  const search = String(merchantColumn?.getFilterValue() ?? "")
  const rows = table.getRowModel().rows

  return (
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
        The dataset has no merchants. Real transactions are split across made-up merchants, skewed on purpose so some look unhealthy.
      </p>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group, i, groups) => (
            // Only the last header row gets a full-width bottom border.
            <TableRow key={group.id} className={i < groups.length - 1 ? "border-b-0! hover:bg-transparent" : undefined}>
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
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                    }
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
              <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                No merchants match "{search}".
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(cell.column.id === GROUP_START_COLUMN && "border-l")}
                  >
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ChallengeOutcomesSheet merchant={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
