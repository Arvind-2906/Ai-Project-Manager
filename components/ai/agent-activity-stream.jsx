"use client";

import { Sparkles, Terminal, CheckCircle2, AlertCircle } from "lucide-react";
import { getAgentBadgeColor } from "@/lib/utils";

export function AgentActivityStream({
  logs = [
    { id: 1, agent: "SUPERVISOR", message: "Received user prompt: 'Synthesize Raft snapshot compaction PRD'. Routing to Product Agent.", time: "10:14:02" },
    { id: 2, agent: "PRODUCT", message: "Generated 4 user stories and 3 non-functional latency targets. Passing state to Task Agent.", time: "10:14:08" },
    { id: 3, agent: "TASK", message: "Decomposed PRD into 6 discrete engineering tasks. Story points assigned via Gemini-1.5-Pro.", time: "10:14:15" },
    { id: 4, agent: "DEPENDENCY", message: "Identified cross-module dependency on Raft WAL streamer. Prepared mutation proposal prop-991.", time: "10:14:22" },
    { id: 5, agent: "SUPERVISOR", message: "LangGraph StateGraph reached checkpoint: Awaiting Human Lead Approval.", time: "10:14:25" },
  ],
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Multi-Agent State Stream (LangGraph)
          </h3>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Live SSE Channel
        </span>
      </div>

      <div className="space-y-2.5 font-mono text-xs max-h-72 overflow-y-auto pr-1">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2.5 rounded-lg bg-background/50 p-2 border border-border/40">
            <span className="text-[10px] text-muted-foreground shrink-0">{log.time}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${getAgentBadgeColor(log.agent)}`}>
              {log.agent}
            </span>
            <span className="text-foreground/90 font-sans text-xs leading-relaxed">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
