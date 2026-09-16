"use client";

import { useState } from "react";
import { Check, X, ShieldAlert, Bot, ArrowRight, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProposalApprovalCard({
  id = "prop-991",
  agentName = "Task & Dependency Agent",
  actionType = "CREATE_TASK_DEPENDENCY",
  description = "AI proposed introducing a strict blocking dependency: DCE-104 (Snapshot Stream) blocks DCE-108 (Scaffolding verification)",
  payload = { from: "DCE-104", to: "DCE-108", type: "BLOCKS" },
  confidence = 0.96,
  onApprove,
  onReject,
}) {
  const [status, setStatus] = useState("PENDING");

  const handleApprove = () => {
    setStatus("APPROVED");
    onApprove?.(id);
  };

  const handleReject = () => {
    setStatus("REJECTED");
    onReject?.(id);
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-sm hover:border-border transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">{agentName}</span>
              <Badge variant="outline" className="text-[10px] font-mono border-blue-500/20 text-blue-400">
                {actionType}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">Proposal ID: {id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Confidence:</span>
          <span className="font-mono text-xs font-bold text-emerald-400">
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <p className="text-xs text-foreground/90 leading-relaxed bg-background/40 p-3 rounded-lg border border-border/50">
        {description}
      </p>

      {/* Payload snippet */}
      <div className="rounded-lg bg-background/60 p-2.5 font-mono text-[11px] text-muted-foreground border border-border/40 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs text-primary font-sans font-medium mb-1">
          <Code className="h-3 w-3" />
          Proposed Mutation Payload
        </div>
        <pre>{JSON.stringify(payload, null, 2)}</pre>
      </div>

      {/* Human-in-the-Loop Action Controls */}
      <div className="flex items-center justify-between border-t border-border/40 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          <span>Requires engineering lead approval</span>
        </div>

        {status === "PENDING" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check className="h-3.5 w-3.5" />
              Approve Mutation
            </Button>
          </div>
        ) : (
          <Badge
            variant={status === "APPROVED" ? "success" : "destructive"}
            className="text-xs"
          >
            {status}
          </Badge>
        )}
      </div>
    </div>
  );
}
