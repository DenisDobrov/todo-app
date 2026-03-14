import { Briefcase, GraduationCap, Rocket } from "lucide-react";

const audiences = [
  {
    icon: Briefcase,
    title: "Career Changers",
    description:
      "Looking to pivot from your current field into the exciting world of AI? Our structured paths make the transition seamless and achievable.",
  },
  {
    icon: Rocket,
    title: "Professionals Upgrading",
    description:
      "Already in tech but want to add AI expertise? Level up your skills with advanced modules designed for experienced professionals.",
  },
  {
    icon: GraduationCap,
    title: "Beginners",
    description:
      "Starting from scratch? Our beginner-friendly curriculum takes you from fundamentals to job-ready skills at your own pace.",
  },
];

export function WhoItsFor() {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
            Built for every stage of your journey
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Whether you&apos;re just starting out or looking to advance, we have a path 
            tailored for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {audiences.map((audience) => (
            <div
              key={audience.title}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors">
                <audience.icon className="h-6 w-6 text-foreground group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {audience.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {audience.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
