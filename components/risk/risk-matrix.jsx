import { RiskCard } from "./risk-card";
import { ShieldAlert, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RiskMatrix() {
  const risks = [
    {
      id: "RSK-01",
      title: "Potential Raft split-brain during cross-region partition",
      severity: "CRITICAL",
      likelihood: "LOW",
      mitigation: "Introduce quorum heartbeats with exponential backoff and pre-vote phase.",
      agentDetected: "Risk Agent",
    },
    {
      id: "RSK-02",
      title: "WAL storage saturation under high ingestion bursts",
      severity: "HIGH",
      likelihood: "MEDIUM",
      mitigation: "Implement dynamic log compaction threshold with backpressure triggers.",
      agentDetected: "Risk Agent",
    },
    {
      id: "RSK-03",
      title: "Schema migration drift between Next.js Prisma and PostgreSQL pgvector extensions",
      severity: "MEDIUM",
      likelihood: "LOW",
      mitigation: "Enforce automated CI migration rollback validation steps.",
      agentDetected: "Supervisor Agent",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Risk Audit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            Active Risk & Technical Debt Registry
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Continuous project scanning powered by Gemini and LangGraph Risk Agent
          </p>
        </div>

        <Button variant="agent" size="sm" className="gap-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Run Realtime Risk Scan
        </Button>
      </div>

      {/* Grid of Identified Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {risks.map((risk) => (
          <RiskCard key={risk.id} {...risk} />
        ))}
      </div>
    </div>
  );
}
