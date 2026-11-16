import { HealthBadge } from "@/components/health-badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { formatPercent } from "@/lib/format"
import type { Emphasis, Health, Ratio } from "@/lib/metrics"
import { cn } from "@/lib/utils"

// Importance is shown with size and weight only. Color is reserved for health.
const EMPHASIS_STYLES = {
  strong: { size: "default", label: "font-medium text-foreground", value: "text-4xl font-semibold" },
  default: { size: "default", label: "", value: "text-3xl font-semibold" },
  quiet: { size: "sm", label: "", value: "text-2xl font-medium" },
} as const satisfies Record<Emphasis, { size: "default" | "sm"; label: string; value: string }>

export interface StatCardProps {
  label: string
  ratio: Ratio
  /** Null means no badge. */
  health: Health | null
  emphasis?: Emphasis
  /** Plain-language meaning of the percentage. */
  caption?: string
  className?: string
}

export function StatCard({
  label,
  ratio,
  health,
  emphasis = "default",
  caption,
  className,
}: StatCardProps) {
  const styles = EMPHASIS_STYLES[emphasis]

  return (
    <Card size={styles.size} className={cn("h-full", className)}>
      <CardHeader>
        <CardDescription className={styles.label}>{label}</CardDescription>
        {health && (
          <CardAction>
            <HealthBadge health={health} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <p className={cn("tabular-nums tracking-tight", styles.value)}>{formatPercent(ratio.rate)}</p>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {ratio.count.toLocaleString()} of {ratio.total.toLocaleString()}
        </p>
      </CardContent>
      {caption && (
        <CardFooter className="mt-auto border-t text-xs text-muted-foreground">{caption}</CardFooter>
      )}
    </Card>
  )
}
