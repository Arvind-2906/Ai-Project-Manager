import { ShieldCheck, Sparkles, Filter } from "lucide-react";
import { ProposalApprovalCard } from "@/components/ai/proposal-approval-card";
import { Button } from "@/components/ui/button";

export default function ApprovalsPage() {
  const proposals = [
    {
      id: "prop-991",
      agentName: "Task & Dependency Agent",
      actionType: "CREATE_TASK_DEPENDENCY",
      description: "Introduce strict blocker: DCE-104 (Snapshot Stream) blocks DCE-108 (Scaffolding validation).",
      payload: { from: "DCE-104", to: "DCE-108", type: "BLOCKS" },
      confidence: 0.96,
    },
    {
      id: "prop-992",
      agentName: "Sprint Agent",
      actionType: "REBALANCE_SPRINT_ALLOCATION",
      description: "Reassign DCE-106 from Sprint 4 to Sprint 5 to prevent developer overload beyond 36 pt capacity limit.",
      payload: { taskId: "DCE-106", targetSprint: "Sprint 5", reason: "Capacity saturation" },
      confidence: 0.91,
    },
    {
      id: "prop-993",
      agentName: "Risk Agent",
      actionType: "CREATE_RISK_ITEM",
      description: "Log high-severity risk: Cross-region network partition latency may degrade consensus quorum.",
      payload: { severity: "HIGH", likelihood: "MEDIUM", title: "Cross-region network partition risk" },
      confidence: 0.88,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            Human-in-the-Loop Approvals Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Agents propose actions; database mutations are executed only upon explicit human review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Filter by Agent
          </Button>
          <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
            Batch Approve Safe Proposals
          </Button>
        </div>
      </div>

      <div className="space-y-4 max-w-4xl">
        {proposals.map((prop) => (
          <ProposalApprovalCard key={prop.id} {...prop} />
        ))}
      </div>
    </div>
  );
}
