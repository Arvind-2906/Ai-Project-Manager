import { ProjectHeader } from "@/components/project/project-header";
import { AgentChat } from "@/components/ai/agent-chat";
import { AgentActivityStream } from "@/components/ai/agent-activity-stream";

export default function ProjectAgentsPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgentChat projectId={projectId} />
        <AgentActivityStream />
      </div>
    </div>
  );
}
