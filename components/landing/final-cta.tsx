import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative rounded-3xl bg-primary px-8 py-16 lg:px-16 lg:py-24 text-center overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5" />
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-primary-foreground max-w-2xl mx-auto text-balance">
              Ready to start your AI career journey?
            </h2>
            <p className="mt-6 text-lg text-primary-foreground/80 max-w-xl mx-auto">
              Join thousands of successful career changers who transformed their 
              professional lives with AI Career Shift.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                Start learning today
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Schedule a consultation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
