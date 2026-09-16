import Link from "next/link";
import {
  FolderGit2,
  CheckCircle2,
  ShieldCheck,
  Bot,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ProjectCard } from "@/components/project/project-card";
import { AgentActivityStream } from "@/components/ai/agent-activity-stream";
import { ProposalApprovalCard } from "@/components/ai/proposal-approval-card";
import { BurndownChart } from "@/components/analytics/burndown-chart";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Top Greeting & Swarm Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Executive Engineering Command Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitoring 3 active autonomous workspaces, 9 LangGraph agents, and 1 active human approval gate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/approvals"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Approvals Queue (1 Action Required)</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Active Workspaces</span>
            <FolderGit2 className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">3 Projects</p>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            100% on-track SLA
          </span>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Sprint Velocity</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">34 pts / sprint</p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Optimal 85% capacity buffer
          </span>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Agent Runs Today</span>
            <Bot className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">148 Runs</p>
          <span className="text-[11px] text-blue-400 font-medium mt-1 block">
            Gemini 1.5 Pro &bull; 0 tool errors
          </span>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Mitigated Risks</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">5 Audited</p>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
            2 pending lead review
          </span>
        </div>
      </div>

      {/* Main Grid: Projects & Live Agent Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projects & Burndown */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Active Workspaces</h2>
              <Link
                href="/projects"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-semibold"
              >
                View all projects <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProjectCard
                id="proj-101"
                name="Distributed Consensus Engine"
                keyPrefix="DCE"
                description="Raft-based multi-region state machine with LangGraph automated incident triage."
                taskCount={42}
                riskCount={2}
                health="Optimal"
              />
              <ProjectCard
                id="proj-102"
                name="Autonomous RAG Knowledge Mesh"
                keyPrefix="RAG"
                description="PostgreSQL pgvector neural indexer with Gemini embedding ingestion pipeline."
                taskCount={29}
                riskCount={1}
                health="Active"
              />
            </div>
          </div>

          <BurndownChart />
        </div>

        {/* Right Column: Approvals & Realtime Agent Stream */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Human-in-the-Loop Gate
              </h3>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">1 Pending</span>
            </div>
            <ProposalApprovalCard
              id="prop-991"
              agentName="Dependency Agent"
              actionType="CREATE_TASK_DEPENDENCY"
              description="Introduce strict blocker: DCE-104 (Snapshot Stream) blocks DCE-108 (Scaffolding validation)."
              payload={{ from: "DCE-104", to: "DCE-108", type: "BLOCKS" }}
              confidence={0.96}
            />
          </div>

          <AgentActivityStream />
        </div>
      </div>
    </div>
  );
}
