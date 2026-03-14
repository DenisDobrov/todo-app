import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCTA() {
  return (
    <section className="px-6 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[32px] border bg-card px-8 py-12 shadow-sm md:px-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Start your next chapter in AI</span>
            </div>

            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Build your path into an{" "}
              <span className="text-emerald-600">AI profession</span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              SOLUTER AI gives you the roadmap, milestones, and practical
              learning system to move from uncertainty to real AI career
              momentum.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/auth">
                  Start learning
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard">View dashboard</Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Designed for career changers, upskillers, and future AI builders.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
