import Link from "next/link";
import { FolderGit2, Bot, Layers, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProjectCard({
  id = "proj-101",
  name = "Distributed Consensus Engine",
  keyPrefix = "DCE",
  description = "Raft-based multi-region state machine with LangGraph automated incident triage.",
  taskCount = 42,
  riskCount = 2,
  health = "Optimal",
}) {
  return (
    <Card className="glass-card hover:border-primary/40 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderGit2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                {keyPrefix}
              </span>
              <CardTitle className="text-base font-semibold text-foreground">
                {name}
              </CardTitle>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
            {health}
          </Badge>
        </div>
        <CardDescription className="text-xs line-clamp-2 mt-2">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-4 pt-0">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-y border-border/50 py-2.5 my-1">
          <div>
            <span className="block text-[10px] uppercase font-mono">Tasks Active</span>
            <span className="text-sm font-semibold text-foreground">{taskCount}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono">Active Risks</span>
            <span className="text-sm font-semibold text-amber-400">{riskCount} Identified</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Bot className="h-3.5 w-3.5 text-blue-400" />
          <span>4 Agents Active</span>
        </div>
        <Link
          href={`/projects/${id}/overview`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Open Workspace
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}
