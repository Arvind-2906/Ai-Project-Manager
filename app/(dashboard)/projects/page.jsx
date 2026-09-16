import { Plus, FolderGit2, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project/project-card";

export default function ProjectsPage() {
  const projects = [
    {
      id: "proj-101",
      name: "Distributed Consensus Engine",
      keyPrefix: "DCE",
      description: "Raft-based multi-region state machine with LangGraph automated incident triage.",
      taskCount: 42,
      riskCount: 2,
      health: "Optimal",
    },
    {
      id: "proj-102",
      name: "Autonomous RAG Knowledge Mesh",
      keyPrefix: "RAG",
      description: "PostgreSQL pgvector neural indexer with Gemini embedding ingestion pipeline.",
      taskCount: 29,
      riskCount: 1,
      health: "Active",
    },
    {
      id: "proj-103",
      name: "Edge API Gateway & Rate Limiter",
      keyPrefix: "EGW",
      description: "Zero-latency Cloudflare Worker proxy with Redis token-bucket rate limiting.",
      taskCount: 15,
      riskCount: 0,
      health: "Active",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Engineering Projects</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Autonomous software workspaces driven by LangGraph multi-agent teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button size="sm" className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4" />
            New AI-Managed Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => (
          <ProjectCard key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}
