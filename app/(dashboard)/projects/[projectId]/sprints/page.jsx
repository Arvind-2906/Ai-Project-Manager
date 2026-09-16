import { ProjectHeader } from "@/components/project/project-header";
import { SprintPlanningBoard } from "@/components/sprint/sprint-planning-board";

export default function ProjectSprintsPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />
      <SprintPlanningBoard />
    </div>
  );
}
