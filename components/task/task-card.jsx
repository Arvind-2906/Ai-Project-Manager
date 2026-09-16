import { CheckCircle2, Clock, GitPullRequest, Sparkles } from "lucide-react";
import { getPriorityBadgeColor } from "@/lib/utils";

export function TaskCard({
  id = "DCE-104",
  title = "Implement Raft Log Compaction with Snapshot Stream",
  priority = "HIGH",
  points = 5,
  status = "IN_PROGRESS",
  agentAssisted = true,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-border/80 bg-card/80 p-3.5 shadow-sm hover:border-primary/50 hover:bg-card transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[11px] font-bold text-muted-foreground">{id}</span>
        <div className="flex items-center gap-1.5">
          {agentAssisted && (
            <span
              title="Decomposed & estimated by AI Task Agent"
              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
            >
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          )}
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${getPriorityBadgeColor(
              priority
            )}`}
          >
            {priority}
          </span>
        </div>
      </div>

      <h4 className="text-xs font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
        {title}
      </h4>

      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {points} pts
        </span>

        <div className="flex items-center gap-1">
          <div className="h-4 w-4 rounded-full bg-indigo-500/20 text-[9px] font-bold text-indigo-400 flex items-center justify-center">
            AK
          </div>
        </div>
      </div>
    </div>
  );
}
