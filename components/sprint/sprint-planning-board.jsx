"use client";

import { Sparkles, Calendar, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SprintPlanningBoard() {
  return (
    <div className="space-y-6">
      {/* Active Sprint Summary Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-primary">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-500/20 text-blue-400 bg-blue-500/10">
                Sprint 4 (Active)
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Oct 1 - Oct 14, 2026
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground mt-2">
              Core Consensus Engine & State Replication
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Targeting stable leader election, snapshot compaction, and guarded API mutations with 99.9% test pass rate.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-background/60 p-3 rounded-lg border border-border/60">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">Committed</span>
              <p className="text-lg font-bold text-foreground">34 pts</p>
            </div>
            <div className="h-8 w-[1px] bg-border/60" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">Completed</span>
              <p className="text-lg font-bold text-emerald-400">18 pts</p>
            </div>
            <div className="h-8 w-[1px] bg-border/60" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-mono text-muted-foreground">Agent Risk</span>
              <p className="text-lg font-bold text-amber-400">Low (12%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Capacity Planning Recommendations */}
      <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-foreground">
              AI Sprint Agent Insights & Capacity Optimization
            </h3>
          </div>
          <Button variant="agent" size="sm" className="text-xs">
            Apply AI Allocations
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-background/50 border border-border/60">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Velocity Balance
            </div>
            <p className="text-muted-foreground">
              Team historical velocity averages 36 points. Current 34 points maintains optimal 85% utilization buffer.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-background/50 border border-border/60">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Critical Path Blocker
            </div>
            <p className="text-muted-foreground">
              Task DCE-104 (Snapshot stream) blocks DCE-108. AI recommends prioritizing developer pairing.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-background/50 border border-border/60">
            <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Sprint Forecast
            </div>
            <p className="text-muted-foreground">
              Projected sprint completion probability: 94.2% based on Monte Carlo simulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
