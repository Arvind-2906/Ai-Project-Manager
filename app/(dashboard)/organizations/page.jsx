import { Building2, Users, Shield, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OrganizationsPage() {
  const members = [
    { name: "Arvind Kumar", email: "lead@enterprise.io", role: "Owner / Staff Engineer", status: "Active" },
    { name: "Elena Rostova", email: "elena@enterprise.io", role: "Principal Architect", status: "Active" },
    { name: "Marcus Chen", email: "marcus@enterprise.io", role: "Senior SRE", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization & Workspaces</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage enterprise team members, agent permissions, and workspace memberships.
          </p>
        </div>

        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" />
          Invite Team Member
        </Button>
      </div>

      {/* Organization Card */}
      <div className="rounded-xl border border-border/80 bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Acme Engineering Cloud</h2>
              <p className="text-xs text-muted-foreground">Enterprise Plan &bull; Neon PostgreSQL + pgvector Dedicated Cluster</p>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
            Enterprise Active
          </Badge>
        </div>
      </div>

      {/* Team Members List */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <div className="border-b border-border/60 bg-muted/20 px-6 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Active Members ({members.length})
          </h3>
        </div>
        <div className="divide-y divide-border/60">
          {members.map((m) => (
            <div key={m.email} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs">
                  {m.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{m.name}</h4>
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-muted-foreground">{m.role}</span>
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-400">
                  {m.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
