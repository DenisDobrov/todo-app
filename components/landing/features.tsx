import {
  Map,
  Code2,
  Compass,
  LayoutDashboard,
  Target,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Map,
    title: "Structured AI Roadmaps",
    description:
      "Follow clear, step-by-step learning paths designed by industry experts. No more guessing what to learn next.",
  },
  {
    icon: Code2,
    title: "Project-Based Learning",
    description:
      "Build real-world AI applications that you can showcase to employers. Learn by doing, not just watching.",
  },
  {
    icon: Compass,
    title: "Career Guidance",
    description:
      "Get personalized advice on job hunting, resume building, and interview preparation from AI career coaches.",
  },
  {
    icon: LayoutDashboard,
    title: "Learning Dashboard",
    description:
      "Track your progress, manage your schedule, and stay motivated with our intuitive learning interface.",
  },
  {
    icon: Target,
    title: "Milestone Tracking",
    description:
      "Set goals, hit milestones, and celebrate achievements as you progress through your AI journey.",
  },
  {
    icon: Users,
    title: "Community & Mentorship",
    description:
      "Connect with fellow learners and get guidance from mentors who have successfully made the transition.",
  },
];

export function Features() {
  return (
    <section id="programs" className="py-20 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
            Everything you need to succeed in AI
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A comprehensive learning platform designed to take you from curious 
            beginner to confident AI professional.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/30 transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                <feature.icon className="h-5 w-5 text-foreground group-hover:text-accent transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
