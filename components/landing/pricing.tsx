import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Simple pricing
        </h2>

        <p className="mt-4 text-muted-foreground">
          Access the full AI transition platform
        </p>

        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-2xl">SOLUTER AI</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-4xl font-semibold">$29 / month</div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>AI learning roadmaps</li>
              <li>Learning dashboard</li>
              <li>Project portfolio builder</li>
              <li>Career transition milestones</li>
            </ul>

            <Button size="lg">Start learning</Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
