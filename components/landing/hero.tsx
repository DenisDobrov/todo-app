import { Button } from "@/components/ui/button";
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { DashboardMockup } from "./dashboard-mockup";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground mb-6">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span>New cohort starting soon</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.1] text-balance">
              Your pathway to an{" "}
              <span className="text-accent">AI career</span>{" "}
              starts here
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
              SOLUTER AI helps professionals transition into AI careers through 
  structured learning paths, real-world projects, and guided mentorship.
  Build practical AI skills and create a portfolio that gets you hired.

            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2">
                <Link href="/auth">Start learning</Link>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <Play className="h-4 w-4" />
                <Link href="/auth">Book a call</Link>
              </Button>
            </div>
            
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-foreground">2,500+</span>{" "}
                <span className="text-muted-foreground">career transitions this year</span>
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
