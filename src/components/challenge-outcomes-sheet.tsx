import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDay, formatPercent, formatPoints } from "@/lib/format"
import type { MerchantMetrics } from "@/lib/metrics"
import { cn } from "@/lib/utils"

const OUTCOME_LABELS = { success: "Success", failed: "Failure", abandoned: "Abandonment" } as const

export function ChallengeOutcomesSheet({
  merchant,
  onClose,
}: {
  merchant: MerchantMetrics | null
  onClose: () => void
}) {
  const shift = merchant?.biggestChallengeShift ?? null

  return (
    <Sheet open={merchant !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {merchant && (
          <>
            <SheetHeader>
              <SheetTitle>{merchant.merchant}: challenge outcomes</SheetTitle>
              <SheetDescription>
                Per day, out of that day's challenged transactions. Mock merchant.
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6">
              {shift && (
                <p className="mb-4 rounded-md border bg-muted/50 p-3 text-sm">
                  <span className="font-medium">Biggest shift:</span> {formatDay(shift.date)},{" "}
                  {OUTCOME_LABELS[shift.outcome].toLowerCase()} rate{" "}
                  {shift.change < 0 ? "fell" : "rose"} {formatPoints(shift.change)} vs. the day before.
                </p>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Success</TableHead>
                    <TableHead>Failure</TableHead>
                    <TableHead>Abandon.</TableHead>
                    <TableHead className="text-right">Challenges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchant.daily.map((day) => {
                    const isShift = shift?.date === day.date
                    const outcomes = day.challengeOutcomes
                    return (
                      <TableRow key={day.date} className={cn(isShift && "bg-muted")}>
                        <TableCell>
                          {formatDay(day.date)}
                          {isShift && (
                            <Badge variant="outline" className="ml-2">
                              Biggest shift
                            </Badge>
                          )}
                        </TableCell>
                        {(["success", "failed", "abandoned"] as const).map((outcome) => (
                          <TableCell
                            key={outcome}
                            className={cn(
                              "tabular-nums",
                              isShift && shift?.outcome === outcome && "font-semibold",
                            )}
                          >
                            {formatPercent(outcomes[outcome].rate)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {outcomes.success.total}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
