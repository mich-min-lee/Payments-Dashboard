import type { ReactNode } from "react"
import { StatCard } from "@/components/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { rejectedEmphasis, type FunnelMetrics } from "@/lib/metrics"
import { cn } from "@/lib/utils"

export type KpiFunnelState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; funnel: FunnelMetrics }

export function KpiFunnel({ state }: { state: KpiFunnelState }) {
  return (
    <section aria-labelledby="funnel-heading" aria-busy={state.status === "loading"}>
      <h2 id="funnel-heading" className="mb-3 text-lg font-semibold">
        3DS funnel
      </h2>
      {state.status === "loading" && <FunnelSkeleton />}
      {state.status === "error" && <FunnelError message={state.message} />}
      {state.status === "ready" && <Funnel funnel={state.funnel} />}
    </section>
  )
}

function Funnel({ funnel }: { funnel: FunnelMetrics }) {
  return (
    // role="list": Safari drops list semantics when list styles are removed.
    <ul role="list">
      <li>
        <StatCard
          label="3DS rate"
          {...funnel.threeDs}
          caption="Share of all transactions that went through 3DS checks."
        />

        <Connector label="Split of 3DS transactions" />
        <ul role="list" aria-label="Split of 3DS transactions" className={levelListClass}>
          <li>
            <StatCard
              label="Frictionless"
              {...funnel.frictionless}
              emphasis="strong"
              caption="Approved by the bank with no extra step."
            />
          </li>
          <li>
            <StatCard
              label="Challenge"
              {...funnel.challenge}
              caption="Asked for an extra check, like a bank code."
            />

            {/* Widen to about 2/3 of the row, centered under Challenge: -(half a card + half a gap) each side. */}
            <div className="md:-mx-[calc(50%+0.5rem)]">
              <Connector label="Split of challenged transactions" />
              <ul role="list" aria-label="Split of challenged transactions" className={levelListClass}>
                <li>
                  <StatCard label="Success" {...funnel.success} emphasis="quiet" caption="Passed the extra check." />
                </li>
                <li>
                  <StatCard label="Failed" {...funnel.failed} emphasis="quiet" caption="Didn't pass the extra check." />
                </li>
                <li>
                  <StatCard
                    label="Abandoned"
                    {...funnel.abandoned}
                    emphasis="strong"
                    caption="Gave up during the extra check."
                  />
                </li>
              </ul>
            </div>
          </li>
          <li>
            <StatCard
              label="Rejected"
              {...funnel.rejected}
              emphasis={rejectedEmphasis(funnel.rejected.health)}
              caption="Blocked by the bank during 3DS."
            />
          </li>
        </ul>
      </li>
    </ul>
  )
}

/** Narrow screens: stacked and indented with a rule. Wide: three across. */
const levelListClass = "grid items-start gap-4 border-l pl-4 md:grid-cols-3 md:border-0 md:pl-0"

/**
 * Wide screens: a line down from the parent card, the level's label, then a
 * bracket with a tick down to each of the three cards. Narrow: just the label.
 */
function Connector({ label }: { label: string }) {
  return (
    <div className="my-3 md:my-0">
      <div aria-hidden className="mx-auto hidden h-3 w-px bg-border md:block" />
      <p className="text-xs text-muted-foreground md:py-1 md:text-center" aria-hidden>
        {label}
      </p>
      <div aria-hidden className="hidden md:block">
        <div className="mx-auto h-2 w-px bg-border" />
        <div className="relative mx-[16.667%] h-3 rounded-t-md border-x border-t">
          <span className="absolute top-0 left-1/2 h-3 w-px bg-border" />
        </div>
      </div>
    </div>
  )
}

function FunnelSkeleton() {
  const card = (className: string, key?: number): ReactNode => (
    <Skeleton key={key} className={cn("rounded-2xl", className)} />
  )
  return (
    <div className="space-y-6" aria-label="Loading 3DS funnel">
      {card("h-36")}
      <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => card("h-40", i))}</div>
      <div className="grid gap-4 md:mx-auto md:w-2/3 md:grid-cols-3">
        {[0, 1, 2].map((i) => card("h-32", i))}
      </div>
    </div>
  )
}

function FunnelError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-critical/30 bg-critical/5 p-4 text-sm">
      <p className="font-medium text-critical">Couldn't load the 3DS funnel</p>
      <p className="mt-1 text-muted-foreground">{message}</p>
    </div>
  )
}
