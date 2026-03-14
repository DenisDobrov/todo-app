import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

const milestones = [
  { title: "Python Fundamentals", status: "completed" },
  { title: "Data Science Essentials", status: "completed" },
  { title: "Deep Learning Foundations", status: "in-progress" },
  { title: "ML Ops & Deployment", status: "planned" },
];

export function DashboardMockup() {
  const progressValue = 68;

  return (
    <div className="relative mx-auto max-w-xl">
      <div className="absolute -left-6 top-8 hidden h-24 w-24 rounded-full bg-emerald-100 blur-2xl lg:block" />
      <div className="absolute -right-4 bottom-10 hidden h-24 w-24 rounded-full bg-primary/10 blur-2xl lg:block" />

      <div className="rounded-[28px] border border-border bg-background/95 p-5 shadow-2xl backdrop-blur">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current path</p>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Machine Learning Engineer
            </h3>
          </div>
          <div className="rounded-2xl border bg-muted/50 p-3">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Career transition progress</span>
            <span className="font-medium text-foreground">{progressValue}%</span>
          </div>
          <Progress value={progressValue} />
        </div>

        <div className="space-y-3">
          {milestones.map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-2xl border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                {item.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}

                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.status === "completed"
                      ? "Completed"
                      : item.status === "in-progress"
                      ? "In progress"
                      : "Planned"}
                  </span>
                </div>
              </div>

              <Badge variant={item.status === "completed" ? "secondary" : "outline"}>
                {item.status === "completed"
                  ? "Done"
                  : item.status === "in-progress"
                  ? "Active"
                  : "Next"}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">Projects completed</div>
            <div className="mt-1 text-2xl font-semibold">12</div>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">Interview readiness</div>
            <div className="mt-1 text-2xl font-semibold">74%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
