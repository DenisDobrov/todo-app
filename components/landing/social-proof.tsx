const logos = [
  { name: "Google", abbr: "G" },
  { name: "Microsoft", abbr: "MS" },
  { name: "Amazon", abbr: "AWS" },
  { name: "Meta", abbr: "M" },
  { name: "OpenAI", abbr: "OAI" },
  { name: "Anthropic", abbr: "A" },
];

export function SocialProof() {
  return (
    <section className="py-16 lg:py-20 border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Our graduates work at leading companies worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-semibold">
                {logo.abbr}
              </div>
              <span className="text-sm font-medium">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
