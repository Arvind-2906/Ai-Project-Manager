import { ProjectHeader } from "@/components/project/project-header";
import { History, ShieldCheck, CheckCircle2, Bot } from "lucide-react";

export default function ProjectActivityPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  const activities = [
    { id: 1, user: "Arvind Kumar", action: "Approved mutation prop-990", target: "DCE-104 Task breakdown", time: "12 mins ago", type: "HUMAN_APPROVAL" },
    { id: 2, user: "LangGraph Risk Agent", action: "Triggered risk mitigation proposal", target: "RSK-01 Split brain", time: "35 mins ago", type: "AGENT_PROPOSAL" },
    { id: 3, user: "LangGraph Task Agent", action: "Assigned 5 story points via Gemini-1.5-Pro", target: "DCE-106 Guarded mutation", time: "1 hour ago", type: "AGENT_ESTIMATE" },
    { id: 4, user: "Elena Rostova", action: "Merged PR #24", target: "Add Raft heartbeat timer", time: "3 hours ago", type: "CODE_MERGE" },
  ];

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Audit Activity & History</h2>
          <p className="text-xs text-muted-foreground">
            Immutable audit trail of human decisions, agent deliberations, and state mutations.
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
          <div className="divide-y divide-border/60">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                    {a.type === "HUMAN_APPROVAL" ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Bot className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{a.user} </span>
                    <span className="text-muted-foreground">{a.action} on </span>
                    <span className="font-mono text-primary">{a.target}</span>
                  </div>
                </div>

                <span className="text-muted-foreground font-mono">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
