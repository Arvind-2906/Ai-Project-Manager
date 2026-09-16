"use client";

import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

export function TaskDetailDialog({ open, onOpenChange, task }) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>{task.id || "DCE-104"}</span>
          <span>&bull;</span>
          <Badge variant="outline">{task.priority || "HIGH"}</Badge>
          <span>&bull;</span>
          <span>{task.points || 5} Story Points</span>
        </div>
        <DialogTitle className="text-xl mt-2">{task.title}</DialogTitle>
        <DialogDescription>
          Decomposed and validated by AI Task & Dependency Agents
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2 text-sm">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Acceptance Criteria (Agent Generated)
          </h4>
          <ul className="space-y-1.5 text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border/60">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>Snapshot stream must not block ongoing raft consensus heartbeats.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>Zero data-race conditions verified via integration concurrency test suite.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span>Storage compaction threshold triggers dynamically at 64MB WAL ceiling.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              Code Review Guardrail
            </span>
            <span className="text-emerald-400 font-mono">Passed Static Analysis</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Review Agent will enforce pgvector semantic duplicate check before PR merge.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        <Button size="sm" className="gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          Approve Sub-tasks
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
