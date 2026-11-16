import { useMemo } from "react"
import { KpiFunnel, type KpiFunnelState } from "@/components/kpi-funnel"
import { MerchantTable } from "@/components/merchant-table"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { funnelMetrics } from "@/lib/metrics"

export default function App() {
  const data = useDashboardData()

  // The only place funnel numbers are computed; the funnel just displays them.
  const funnelState = useMemo<KpiFunnelState>(() => {
    if (data.status === "loading") return { status: "loading" }
    if (data.status === "error") return { status: "error", message: data.error }
    return { status: "ready", funnel: funnelMetrics(data.transactions) }
  }, [data])

  return (
    <main className="mx-auto min-h-svh max-w-6xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight">3DS Dashboard</h1>
      {data.status === "success" && (
        <p className="mt-1 text-sm text-muted-foreground">
          {data.transactions.length.toLocaleString()} transactions
          {data.skipped > 0 && ` (${data.skipped} skipped as invalid)`}
        </p>
      )}

      <div className="mt-6">
        <KpiFunnel state={funnelState} />
      </div>

      {data.status === "success" && (
        <section className="mt-10">
          <MerchantTable transactions={data.transactions} />
        </section>
      )}
    </main>
  )
}
