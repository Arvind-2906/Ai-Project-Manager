import { ProjectHeader } from "@/components/project/project-header";
import { Cpu, Database, Network, Shield, Sparkles } from "lucide-react";

export default function ProjectArchitecturePage({ params }) {
  const projectId = params?.projectId || "proj-101";

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">System Architecture & RAG Embeddings</h2>
          <p className="text-xs text-muted-foreground">
            Architectural topology indexed in Neon PostgreSQL with pgvector embeddings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Cpu className="h-4 w-4" />
              Consensus Cluster
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              3-node Raft consensus replication state machine with gRPC streaming transport and WAL compaction.
            </p>
            <div className="text-[10px] font-mono text-emerald-400">pgvector RAG: 18 chunks embedded</div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
              <Database className="h-4 w-4" />
              Persistence Layer
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Neon Serverless PostgreSQL holding relational task schemas alongside 768-dim Gemini text embeddings.
            </p>
            <div className="text-[10px] font-mono text-emerald-400">Prisma Managed Schema: Active</div>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <Network className="h-4 w-4" />
              LangGraph StateGraph
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Asynchronous supervisor orchestrator controlling 9 sub-agents with human-in-the-loop approval checkpointing.
            </p>
            <div className="text-[10px] font-mono text-emerald-400">FastAPI SSE: Connected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
