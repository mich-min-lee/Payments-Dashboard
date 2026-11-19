import { useState, type ReactNode } from "react"
import { ArrowRight, Moon, Plus, Sun } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

// A living catalog of packages/ui: every variant × size, plus the states we can show
// statically. Hover, focus, and press are live — mouse over or Tab through to see them.

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
type TextSize = "xs" | "sm" | "default" | "lg"
type IconSize = "icon-xs" | "icon-sm" | "icon" | "icon-lg"

const VARIANTS: Variant[] = ["default", "outline", "secondary", "ghost", "destructive", "link"]
const TEXT_SIZES: TextSize[] = ["xs", "sm", "default", "lg"]
const ICON_SIZES: IconSize[] = ["icon-xs", "icon-sm", "icon", "icon-lg"]

export default function App() {
  const [dark, setDark] = useState(false)

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    // The theme's dark tokens live under `.dark`, so flip it on <html>.
    document.documentElement.classList.toggle("dark", next)
  }

  return (
    <main className="mx-auto max-w-6xl space-y-12 bg-background p-8 text-foreground">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">UI playground</h1>
          <p className="mt-1 text-muted-foreground">
            Every component in <code className="font-mono text-sm">packages/ui</code>, in every
            variant and state. Hover, focus (Tab), and press are live.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={toggleTheme}>
          {dark ? <Sun data-icon="inline-start" /> : <Moon data-icon="inline-start" />}
          {dark ? "Light" : "Dark"}
        </Button>
      </header>

      <Section title="Button" subtitle="Variants × sizes">
        <Grid columns={TEXT_SIZES}>
          {VARIANTS.map((variant) => (
            <Row key={variant} label={variant}>
              {TEXT_SIZES.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  Button
                </Button>
              ))}
            </Row>
          ))}
        </Grid>
      </Section>

      <Section title="Button with icons" subtitle="Icon side gets less padding to look balanced">
        <Grid columns={TEXT_SIZES}>
          <Row label="icon start">
            {TEXT_SIZES.map((size) => (
              <Button key={size} size={size}>
                <Plus data-icon="inline-start" />
                Add
              </Button>
            ))}
          </Row>
          <Row label="icon end">
            {TEXT_SIZES.map((size) => (
              <Button key={size} size={size} variant="outline">
                Next
                <ArrowRight data-icon="inline-end" />
              </Button>
            ))}
          </Row>
        </Grid>
      </Section>

      <Section title="Icon buttons" subtitle="Square sizes match the text-button heights">
        <Grid columns={ICON_SIZES}>
          {VARIANTS.filter((v) => v !== "link").map((variant) => (
            <Row key={variant} label={variant}>
              {ICON_SIZES.map((size) => (
                <Button key={size} variant={variant} size={size} aria-label="Add">
                  <Plus />
                </Button>
              ))}
            </Row>
          ))}
        </Grid>
      </Section>

      <Section title="States" subtitle="The ones that can be shown without interacting">
        <Grid columns={["disabled", "invalid", "expanded"]}>
          {VARIANTS.map((variant) => (
            <Row key={variant} label={variant}>
              <Button variant={variant} disabled>
                Disabled
              </Button>
              <Button variant={variant} aria-invalid>
                Invalid
              </Button>
              <Button variant={variant} aria-expanded>
                Expanded
              </Button>
            </Row>
          ))}
        </Grid>
      </Section>
    </main>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border p-6">{children}</div>
    </section>
  )
}

// Column headers on top, a label down the left; each Row's children fill the columns.
function Grid({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div
      className="grid items-center gap-x-6 gap-y-4"
      style={{ gridTemplateColumns: `7rem repeat(${columns.length}, max-content)` }}
    >
      <span />
      {columns.map((c) => (
        <span key={c} className="font-mono text-xs text-muted-foreground">
          {c}
        </span>
      ))}
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      {children}
    </>
  )
}
