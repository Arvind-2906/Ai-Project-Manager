import { ProjectHeader } from "@/components/project/project-header";
import { TaskCard } from "@/components/task/task-card";
import { Filter, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectTasksPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  const tasks = [
    { id: "DCE-103", title: "Configure pgvector vector store collection for PRD semantic search", priority: "HIGH", points: 5, agentAssisted: true },
    { id: "DCE-104", title: "Implement Raft Log Compaction with Snapshot Stream", priority: "CRITICAL", points: 8, agentAssisted: true },
    { id: "DCE-105", title: "Develop LangGraph Supervisor state routing machine", priority: "HIGH", points: 8, agentAssisted: true },
    { id: "DCE-106", title: "Implement guarded mutation proposal approval endpoint", priority: "HIGH", points: 5, agentAssisted: true },
    { id: "DCE-107", title: "Audit Better Auth middleware token validation in Edge runtimes", priority: "MEDIUM", points: 3, agentAssisted: false },
    { id: "DCE-108", title: "Bootstrap Next.js, Prisma schema, and FastAPI microservice scaffolding", priority: "CRITICAL", points: 5, agentAssisted: true },
  ];

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">All Workspace Tasks</h2>
          <p className="text-xs text-muted-foreground">
            Complete list of engineering tasks with assigned story points and acceptance criteria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button size="sm" className="gap-1 text-xs">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} {...task} />
        ))}
      </div>
    </div>
  );
}
