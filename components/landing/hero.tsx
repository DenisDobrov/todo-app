import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "./dashboard-mockup";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 lg:pb-32 lg:pt-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Early access for the next cohort</span>
            </div>

            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Transition into an{" "}
              <span className="text-emerald-600">AI career</span>{" "}
              with structure, practice, and momentum
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              DOBROW Academy helps professionals move into AI roles through guided
              roadmaps, practical projects, and a progress dashboard that turns
              career change into a clear step-by-step system.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/auth">
                  Start learning
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" size="lg" className="gap-2" asChild>
                <Link href="/dashboard">
                  <Play className="h-4 w-4" />
                  View dashboard
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {["M", "A", "L", "D"].map((letter) => (
                  <div
                    key={letter}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-foreground">2,500+</span>{" "}
                <span className="text-muted-foreground">
                  learners transitioning into AI roles
                </span>
              </div>
            </div>
          </div>

          <div className="relative lg:pl-8">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
