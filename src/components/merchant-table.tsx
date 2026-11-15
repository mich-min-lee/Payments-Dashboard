import { useMemo } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { merchantMetrics, type MerchantMetrics, type Ratio } from "@/lib/metrics"
import { mockMerchantFor } from "@/lib/mock-merchants"
import type { Transaction } from "@/types"

// Module level so the table doesn't rebuild these on every render.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
})

const helper = createColumnHelper<typeof features, MerchantMetrics>()

/** Sort by the rate; merchants with no rate go last. */
const rateOf = (ratio: Ratio) => ratio.rate ?? undefined

const columns = helper.columns([
  helper.accessor("merchant", {
    header: "Merchant",
    sortFn: "text",
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
          <Percent rate={rate} />
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
        cell: (info) => <RatioCell ratio={info.row.original.threeDsOutcomes.challenge} />,
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

function Percent({ rate }: { rate: number | null }) {
  return <span className="tabular-nums">{rate === null ? "—" : `${(rate * 100).toFixed(1)}%`}</span>
}

function RatioCell({ ratio }: { ratio: Ratio }) {
  return (
    <div>
      <Percent rate={ratio.rate} />
      <div className="text-xs text-muted-foreground tabular-nums">{ratio.count.toLocaleString()}</div>
    </div>
  )
}

export function MerchantTable({ transactions }: { transactions: readonly Transaction[] }) {
  const data = useMemo(
    () => merchantMetrics(transactions, (t) => mockMerchantFor(t.id)),
    [transactions],
  )
  const table = useTable({ features, columns, data })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Merchants</h2>
        <Badge variant="outline">Mock data</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        The dataset has no merchants, so transactions are split across made-up merchants at random.
      </p>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={header.colSpan > 1 ? "text-center" : undefined}
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
