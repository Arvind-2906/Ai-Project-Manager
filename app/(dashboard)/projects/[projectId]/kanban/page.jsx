import { ProjectHeader } from "@/components/project/project-header";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function ProjectKanbanPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />
      <KanbanBoard />
    </div>
  );
}
