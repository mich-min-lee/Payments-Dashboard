import { useMemo, useState, type CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MerchantTable } from "@/components/merchant-table"
import { SiteHeader } from "@/components/site-header"
import { SummarySection, type SummaryState } from "@/components/summary-section"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { formatDayRange } from "@/lib/format"
import { periodSummary, type Period } from "@/lib/metrics"

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const satisfies readonly { value: Period; label: string }[]

function isPeriod(value: string): value is Period {
  return PERIODS.some((p) => p.value === value)
}

export default function App() {
  const data = useDashboardData()
  const [period, setPeriod] = useState<Period>("today")

  // The only place summary numbers are computed; the section just displays them.
  const summaryState = useMemo<SummaryState>(() => {
    if (data.status === "loading") return { status: "loading" }
    if (data.status === "error") return { status: "error", message: data.error }
    const summary = periodSummary(data.transactions, period)
    return summary
      ? { status: "ready", summary }
      : { status: "error", message: "No transactions to summarize." }
  }, [data, period])

  return (
    // dashboard-01's layout reads these; without --header-height the top bar collapses to 0px.
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader trail={["General", "Analytics", "Fraud Analytics"]} />
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Fraud Analytics</h1>
              {summaryState.status === "ready" && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDayRange(summaryState.summary.from, summaryState.summary.to)}
                  {data.status === "success" && data.skipped > 0 && ` · ${data.skipped} invalid records skipped`}
                </p>
              )}
            </div>
            {/* shadcn's dashboard pattern: a toggle group where there's room, a select on narrow screens. */}
            <ToggleGroup
              type="single"
              aria-label="Time period"
              value={period}
              // Radix sends "" when the active item is clicked again; keep the current period.
              onValueChange={(value) => isPeriod(value) && setPeriod(value)}
              className="hidden sm:flex"
            >
              {PERIODS.map((p) => (
                <ToggleGroupItem key={p.value} value={p.value}>
                  {p.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Select value={period} onValueChange={(value) => isPeriod(value) && setPeriod(value)}>
              <SelectTrigger aria-label="Time period" className="w-40 sm:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </header>

          <SummarySection state={summaryState} />

          {data.status === "success" && (
            <section className="mt-10">
              <MerchantTable transactions={data.transactions} />
            </section>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
