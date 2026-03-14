import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I went from being a marketing manager to an ML Engineer at a top tech company in just 8 months. The structured approach made all the difference.",
    author: "Sarah Chen",
    role: "ML Engineer at Google",
    previousRole: "Former Marketing Manager",
  },
  {
    quote:
      "The project-based curriculum gave me real experience I could talk about in interviews. I landed a role with a 40% salary increase.",
    author: "Marcus Johnson",
    role: "AI Product Manager at Microsoft",
    previousRole: "Former Software Developer",
  },
  {
    quote:
      "As someone with no tech background, I was intimidated at first. But the beginner-friendly approach and supportive community helped me succeed.",
    author: "Emily Rodriguez",
    role: "Data Scientist at Meta",
    previousRole: "Former Financial Analyst",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
            Trusted by career changers worldwide
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands who have successfully transitioned into AI careers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="p-8 rounded-2xl bg-card border border-border"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-accent text-accent"
                  />
                ))}
              </div>
              <blockquote className="text-foreground leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {testimonial.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-accent">{testimonial.previousRole}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
