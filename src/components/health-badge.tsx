import { CircleAlert, CircleCheck, CircleX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Health } from "@/lib/metrics"
import { cn } from "@/lib/utils"

const HEALTH_STYLES = {
  healthy: { label: "Healthy", icon: CircleCheck, className: "border-healthy/25 bg-healthy/10 text-healthy" },
  warning: { label: "Warning", icon: CircleAlert, className: "border-warning/25 bg-warning/10 text-warning" },
  critical: { label: "Critical", icon: CircleX, className: "border-critical/25 bg-critical/10 text-critical" },
} as const satisfies Record<Health, { label: string; icon: unknown; className: string }>

export function HealthBadge({ health }: { health: Health }) {
  const { label, icon: Icon, className } = HEALTH_STYLES[health]
  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}
