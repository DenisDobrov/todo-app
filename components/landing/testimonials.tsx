import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  {
    name: "Alex M.",
    role: "Data Analyst → ML Engineer",
    text: "SOLUTER AI gave me a clear path into machine learning. I stopped jumping between tutorials and started building real projects.",
  },
  {
    name: "Maria S.",
    role: "Marketing → AI Specialist",
    text: "The structured roadmap helped me transition into AI much faster than self-study.",
  },
  {
    name: "Daniel K.",
    role: "Software Engineer",
    text: "The dashboard and milestone system made learning AI feel like a real progression system.",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          What learners say
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  "{t.text}"
                </p>

                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
