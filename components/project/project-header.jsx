"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Columns3,
  Timer,
  CheckSquare,
  GitGraph,
  ShieldAlert,
  Cpu,
  Bot,
  LineChart,
  History,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Overview", href: "overview", icon: LayoutDashboard },
  { name: "Backlog", href: "backlog", icon: ListTodo },
  { name: "Kanban", href: "kanban", icon: Columns3 },
  { name: "Sprints", href: "sprints", icon: Timer },
  { name: "Tasks", href: "tasks", icon: CheckSquare },
  { name: "Dependencies", href: "dependencies", icon: GitGraph },
  { name: "Risks", href: "risks", icon: ShieldAlert },
  { name: "Architecture", href: "architecture", icon: Cpu },
  { name: "Agents", href: "agents", icon: Bot },
  { name: "Analytics", href: "analytics", icon: LineChart },
  { name: "Activity", href: "activity", icon: History },
  { name: "Settings", href: "settings", icon: Settings },
];

export function ProjectHeader({ projectId = "proj-101", title = "Distributed Consensus Engine", keyPrefix = "DCE" }) {
  const pathname = usePathname();

  return (
    <div className="mb-8 space-y-4 border-b border-border/60 pb-2">
      {/* Project Meta Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>PROJECTS</span>
            <span>/</span>
            <span className="text-primary font-semibold">{keyPrefix}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
            {title}
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Active Sprint 4
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500">
            <Sparkles className="h-3.5 w-3.5" />
            Trigger Agent Audit
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex overflow-x-auto gap-1 pt-2 no-scrollbar">
        {tabs.map((tab) => {
          const tabUrl = `/projects/${projectId}/${tab.href}`;
          const isActive = pathname === tabUrl || pathname.startsWith(`${tabUrl}/`);

          return (
            <Link
              key={tab.name}
              href={tabUrl}
              className={cn(
                "flex items-center gap-2 border-b-2 px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
