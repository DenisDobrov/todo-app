export function SocialProof() {
  return (
    <section className="px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <p className="text-sm text-muted-foreground">
          Professionals from leading companies are preparing for AI roles
        </p>

        <div className="mt-8 grid grid-cols-2 gap-6 text-muted-foreground sm:grid-cols-3 md:grid-cols-6">
          {["Google", "Amazon", "Meta", "Tesla", "Nvidia", "OpenAI"].map((c) => (
            <div
              key={c}
              className="rounded-lg border bg-card px-4 py-3 text-sm font-medium"
            >
              {c}
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          More than <span className="font-semibold text-foreground">2,500 learners</span>{" "}
          are building AI skills with SOLUTER AI
        </p>
      </div>
    </section>
  )
}
