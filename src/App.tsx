import { useDashboardData } from "@/hooks/use-dashboard-data"

export default function App() {
  const data = useDashboardData()

  return (
    <main className="mx-auto min-h-svh max-w-6xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight">3DS Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        {data.status === "loading" && "Loading transactions…"}
        {data.status === "error" && `Error: ${data.error}`}
        {data.status === "success" &&
          `${data.transactions.length.toLocaleString()} transactions loaded` +
            (data.skipped > 0 ? ` (${data.skipped} skipped)` : "")}
      </p>
    </main>
  )
}
