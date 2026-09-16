import { ProjectHeader } from "@/components/project/project-header";
import { DependencyFlow } from "@/components/architecture/dependency-flow";

export default function ProjectDependenciesPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />
      <DependencyFlow />
    </div>
  );
}
