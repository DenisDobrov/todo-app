import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for self-paced learners who want to explore AI.",
    features: [
      "Access to 3 learning paths",
      "Basic project templates",
      "Community forum access",
      "Monthly group Q&A sessions",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For serious career changers committed to their AI journey.",
    features: [
      "Access to all learning paths",
      "Advanced project templates",
      "1-on-1 mentor sessions (2/month)",
      "Career coaching & resume review",
      "Interview preparation",
      "Priority support",
      "Certificate of completion",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$399",
    period: "/month",
    description: "For teams and organizations upskilling their workforce.",
    features: [
      "Everything in Professional",
      "Custom learning paths",
      "Dedicated account manager",
      "Team analytics dashboard",
      "White-label certificates",
      "API access",
      "SLA guarantee",
    ],
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance">
            Invest in your AI future
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your learning style and career goals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-8 rounded-2xl border transition-all duration-300",
                plan.popular
                  ? "bg-primary text-primary-foreground border-primary shadow-xl scale-105"
                  : "bg-card border-border hover:border-accent/30"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={cn(
                    "text-xl font-semibold mb-2",
                    plan.popular ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  {plan.name}
                </h3>
                <p
                  className={cn(
                    "text-sm",
                    plan.popular
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span
                  className={cn(
                    "text-4xl font-bold",
                    plan.popular ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  {plan.price}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    plan.popular
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={cn(
                        "h-5 w-5 shrink-0 mt-0.5",
                        plan.popular ? "text-accent" : "text-accent"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        plan.popular
                          ? "text-primary-foreground/90"
                          : "text-muted-foreground"
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? "secondary" : "default"}
              >
                Get started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
