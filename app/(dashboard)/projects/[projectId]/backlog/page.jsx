import { ProjectHeader } from "@/components/project/project-header";
import { Sparkles, Plus, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BacklogPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  const backlogItems = [
    { id: "DCE-110", title: "Synthesize Raft Pre-Vote protocol to suppress disruptive election campaigns", priority: "HIGH", points: 5, epic: "Consensus Safety" },
    { id: "DCE-111", title: "Write pgvector HNSW index tuning migration for high dimension embeddings", priority: "MEDIUM", points: 3, epic: "RAG Infrastructure" },
    { id: "DCE-112", title: "Implement Redis distributed lock guardrail for concurrent agent workflows", priority: "HIGH", points: 5, epic: "Agent Orchestration" },
    { id: "DCE-113", title: "Add automated flaky test quarantine workflow in GitHub Actions", priority: "LOW", points: 2, epic: "CI/CD Reliability" },
  ];

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Product Backlog</h2>
          <p className="text-xs text-muted-foreground">
            Decomposed PRD stories with automated story point estimation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="agent" size="sm" className="gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Decompose Raw Idea into Stories
          </Button>
          <Button size="sm" className="gap-1 text-xs">
            <Plus className="h-4 w-4" />
            New Item
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <div className="divide-y divide-border/60">
          {backlogItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-accent/40 transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-muted-foreground">{item.id}</span>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                  <span className="text-[10px] text-muted-foreground font-mono">{item.epic}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px]">{item.priority}</Badge>
                <span className="text-xs font-mono text-muted-foreground">{item.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
