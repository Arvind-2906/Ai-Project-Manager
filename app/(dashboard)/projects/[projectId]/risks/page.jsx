import { ProjectHeader } from "@/components/project/project-header";
import { RiskMatrix } from "@/components/risk/risk-matrix";

export default function ProjectRisksPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />
      <RiskMatrix />
    </div>
  );
}
