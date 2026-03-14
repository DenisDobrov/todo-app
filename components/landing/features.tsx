import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Target, Layers, Rocket } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI learning roadmaps",
    text: "Structured paths to become a machine learning engineer, AI engineer, or data scientist.",
  },
  {
    icon: Layers,
    title: "Project-based learning",
    text: "Build real AI projects instead of watching endless tutorials.",
  },
  {
    icon: Target,
    title: "Career transition system",
    text: "Clear milestones that guide you from beginner to job-ready AI professional.",
  },
  {
    icon: Rocket,
    title: "Portfolio building",
    text: "Create a portfolio that helps you stand out in AI job interviews.",
  },
]

export function Features() {
  return (
    <section id="features" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Everything you need to transition into AI
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader className="flex flex-row items-center gap-3">
                <f.icon className="h-5 w-5 text-emerald-600" />
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>

              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {f.text}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
