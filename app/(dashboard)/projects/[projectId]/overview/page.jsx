import { ProjectHeader } from "@/components/project/project-header";
import { BurndownChart } from "@/components/analytics/burndown-chart";
import { VelocityChart } from "@/components/analytics/velocity-chart";
import { AgentActivityStream } from "@/components/ai/agent-activity-stream";
import { CheckCircle2, Clock, GitPullRequest, Layers, ShieldCheck } from "lucide-react";

export default function ProjectOverviewPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/80 bg-card p-4">
          <span className="text-xs text-muted-foreground">Sprint 4 Completion</span>
          <p className="text-2xl font-bold text-foreground mt-1">52.9%</p>
          <span className="text-[11px] text-emerald-400">18 of 34 points done</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4">
          <span className="text-xs text-muted-foreground">Critical Path Lag</span>
          <p className="text-2xl font-bold text-foreground mt-1">0.0 Days</p>
          <span className="text-[11px] text-emerald-400">On schedule</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4">
          <span className="text-xs text-muted-foreground">Active Blockers</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">1 Blocker</p>
          <span className="text-[11px] text-muted-foreground">DCE-104 snapshot stream</span>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4">
          <span className="text-xs text-muted-foreground">Agent Confidence</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">96.4%</p>
          <span className="text-[11px] text-muted-foreground">LangGraph Swarm Stable</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BurndownChart />
        <VelocityChart />
      </div>

      <AgentActivityStream />
    </div>
  );
}
