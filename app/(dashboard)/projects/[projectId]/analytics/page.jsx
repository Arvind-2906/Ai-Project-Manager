import { ProjectHeader } from "@/components/project/project-header";
import { BurndownChart } from "@/components/analytics/burndown-chart";
import { VelocityChart } from "@/components/analytics/velocity-chart";

export default function ProjectAnalyticsPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Sprint & Velocity Analytics</h2>
          <p className="text-xs text-muted-foreground">
            Quantitative velocity, cycle time distributions, and burndown forecasts powered by Recharts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BurndownChart />
          <VelocityChart />
        </div>
      </div>
    </div>
  );
}
