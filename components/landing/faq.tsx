const questions = [
  {
    q: "Do I need programming experience?",
    a: "Basic programming knowledge helps, but the roadmap starts with Python fundamentals.",
  },
  {
    q: "How long does the transition take?",
    a: "Most learners reach a portfolio level in 3–6 months depending on their pace.",
  },
  {
    q: "Is this suitable for career changers?",
    a: "Yes. DOBROW Academy was designed specifically for professionals transitioning into AI.",
  },
  {
    q: "What makes this different from online courses?",
    a: "Instead of random lessons, you follow a structured AI career roadmap with milestones and projects.",
  },
]

export function FAQ() {
  return (
    <section id="faq" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>

        <div className="mt-10 space-y-6">
          {questions.map((item) => (
            <div key={item.q}>
              <h3 className="font-medium">{item.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
