import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const groups = [
  {
    title: "Professionals transitioning to AI",
    text: "Engineers, analysts and developers moving into machine learning and AI roles.",
  },
  {
    title: "Career changers",
    text: "Professionals from other industries who want to build real AI skills and enter the tech world.",
  },
  {
    title: "Students and graduates",
    text: "People who want a structured roadmap instead of random online tutorials.",
  },
]

export function WhoItsFor() {
  return (
    <section id="programs" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Who DOBROW Academy is for
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {groups.map((g) => (
            <Card key={g.title}>
              <CardHeader>
                <CardTitle>{g.title}</CardTitle>
              </CardHeader>

              <CardContent className="text-muted-foreground text-sm leading-relaxed">
                {g.text}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
