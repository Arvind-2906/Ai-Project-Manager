import { ProjectHeader } from "@/components/project/project-header";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Save, Trash2 } from "lucide-react";

export default function ProjectSettingsPage({ params }) {
  const projectId = params?.projectId || "proj-101";

  return (
    <div className="space-y-6">
      <ProjectHeader projectId={projectId} />

      <div className="space-y-6 max-w-3xl">
        <div>
          <h2 className="text-lg font-bold text-foreground">Project Governance & AI Guardrails</h2>
          <p className="text-xs text-muted-foreground">
            Configure agent tool mutation permissions and human approval thresholds.
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            Human-in-the-Loop Policy
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/60 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
              <div>
                <span className="font-semibold text-foreground block">Require Lead Approval for Database Mutations</span>
                <span className="text-muted-foreground text-[11px]">Tasks, dependencies, and sprints proposed by agents remain pending until approved.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/60 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
              <div>
                <span className="font-semibold text-foreground block">Enforce pgvector Semantic Duplicate Detection</span>
                <span className="text-muted-foreground text-[11px]">Reject or warn if new user stories match existing backlog items with &gt; 85% cosine similarity.</span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <Button size="sm" className="gap-1.5 text-xs">
              <Save className="h-4 w-4" />
              Save Governance Settings
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 space-y-3">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground">
            Archive or permanently delete this workspace, tasks, and indexed vector embeddings.
          </p>
          <Button variant="destructive" size="sm" className="text-xs">
            Archive Workspace
          </Button>
        </div>
      </div>
    </div>
  );
}
