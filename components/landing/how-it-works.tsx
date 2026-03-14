const steps = [
  {
    number: "01",
    title: "Choose Your Path",
    description:
      "Take our assessment to discover the AI career path that matches your background, interests, and goals. We'll create a personalized roadmap just for you.",
  },
  {
    number: "02",
    title: "Learn & Build Projects",
    description:
      "Follow your customized curriculum, complete hands-on projects, and build a portfolio that showcases your AI skills to future employers.",
  },
  {
    number: "03",
    title: "Transition Into AI",
    description:
      "With career coaching, interview prep, and our hiring partner network, you'll land your dream AI role and start your new career.",
  },
];

export function HowItWorks() {
  return (
    <section id="roadmaps" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
            Your journey in three simple steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We&apos;ve simplified the path to your AI career so you can focus on learning.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-px bg-border -translate-x-1/2" />
              )}
              <div className="text-5xl lg:text-6xl font-bold text-accent/20 mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
