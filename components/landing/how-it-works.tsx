import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    title: "Choose your AI path",
    text: "Select a roadmap like Machine Learning Engineer or AI Developer.",
  },
  {
    title: "Complete milestones",
    text: "Follow structured tasks and learning modules inside the dashboard.",
  },
  {
    title: "Build real projects",
    text: "Create portfolio projects demonstrating your AI skills.",
  },
  {
    title: "Move into AI roles",
    text: "Apply for jobs with practical experience and a clear portfolio.",
  },
]

export function HowItWorks() {
  return (
    <section id="roadmaps" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          How DOBROW Academy works
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title}>
              <CardContent className="space-y-2 p-6">
                <div className="text-sm font-semibold text-emerald-600">
                  Step {i + 1}
                </div>
                <h3 className="font-medium">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
