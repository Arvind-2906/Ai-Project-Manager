import { ShieldAlert, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RiskCard({
  id = "RSK-01",
  title = "Potential Raft split-brain during cross-region partition",
  severity = "CRITICAL",
  likelihood = "LOW",
  mitigation = "Introduce quorum heartbeats with exponential backoff and pre-vote phase.",
  agentDetected = "Risk Agent",
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-400" />
          <span className="font-mono text-xs font-bold text-muted-foreground">{id}</span>
          <Badge
            variant="outline"
            className={
              severity === "CRITICAL"
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
            }
          >
            {severity} Severity
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">Likelihood: {likelihood}</span>
      </div>

      <h4 className="text-xs font-semibold text-foreground leading-snug">{title}</h4>

      <div className="rounded-lg bg-background/50 p-2.5 text-xs border border-border/40 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
          Mitigation Strategy
        </span>
        <p className="text-muted-foreground text-[11px] leading-relaxed">{mitigation}</p>
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
        <span>Identified by {agentDetected}</span>
        <button className="text-primary hover:underline inline-flex items-center gap-1 font-medium">
          Create Mitigation Task <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
