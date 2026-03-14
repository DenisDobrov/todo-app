import { CheckCircle2, Clock, TrendingUp } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="relative">
      {/* Main Dashboard Card */}
      <div className="rounded-2xl bg-card border border-border shadow-2xl shadow-primary/5 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Current Path</p>
            <h3 className="text-lg font-semibold text-foreground">Machine Learning Engineer</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">68%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[68%] bg-accent rounded-full" />
          </div>
        </div>
        
        {/* Milestones */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <span className="text-sm text-foreground">Python Fundamentals</span>
            <span className="ml-auto text-xs text-accent font-medium">Completed</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <span className="text-sm text-foreground">Data Science Essentials</span>
            <span className="ml-auto text-xs text-accent font-medium">Completed</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-accent/30 bg-accent/5">
            <Clock className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-foreground">Deep Learning Foundations</span>
            <span className="ml-auto text-xs text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
            <span className="text-sm text-muted-foreground">MLOps & Deployment</span>
          </div>
        </div>
      </div>
      
      {/* Floating Stats Card */}
      <div className="absolute -bottom-4 -left-4 lg:-left-8 rounded-xl bg-card border border-border shadow-xl p-4 w-48">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <span className="text-accent font-bold">12</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Projects</p>
            <p className="text-sm font-semibold text-foreground">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
