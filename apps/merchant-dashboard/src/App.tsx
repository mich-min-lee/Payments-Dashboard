import { Button } from "@workspace/ui/components/button"

// Placeholder until the shell (Milestone 3). Proves the shared package and theme load:
// these buttons come from packages/ui, and their colors come from its globals.css tokens.
export default function App() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
      <p className="mt-1 text-muted-foreground">Merchant dashboard: scaffold is working.</p>
      <div className="mt-6 flex gap-2">
        <Button variant={"default"}>Withdraw funds</Button>
        <Button variant="outline">Statements</Button>
      </div>
    </main>
  )
}
