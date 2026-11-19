import { CircleAlert, CircleCheck, CircleX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

const ICON_COLOR = { healthy: "text-healthy", warning: "text-warning", critical: "text-critical" } as const

// Icon-only shapes: critical is an exclamation, not an X (an X reads as "cancelled").
const ICONS = { healthy: CircleCheck, warning: CircleAlert, critical: CircleAlert } as const

/**
 * Icon-only status for tight spaces. The word shows in a tooltip on hover or keyboard
 * focus, and screen readers read it as the icon's label.
 * Set `tooltip={false}` inside another control (e.g. a button) that already says it.
 */
export function HealthIcon({
  health,
  tooltip = true,
  className,
}: {
  health: Health
  tooltip?: boolean
  className?: string
}) {
  const { label } = HEALTH_STYLES[health]
  const Icon = ICONS[health]
  const icon = (
    <span
      role="img"
      aria-label={label}
      tabIndex={tooltip ? 0 : undefined}
      className={cn("inline-flex rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", ICON_COLOR[health], className)}
    >
      <Icon aria-hidden className="size-4" />
    </span>
  )
  if (!tooltip) return icon
  return (
    <Tooltip>
      <TooltipTrigger asChild>{icon}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
