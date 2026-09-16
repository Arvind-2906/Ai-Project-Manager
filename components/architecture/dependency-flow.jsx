"use client";

import React from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitGraph, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialNodes = [
  {
    id: "1",
    position: { x: 50, y: 100 },
    data: { label: "DCE-101: TLS Handshake" },
    style: { background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", padding: "10px" },
  },
  {
    id: "2",
    position: { x: 300, y: 100 },
    data: { label: "DCE-104: Raft Compaction (CRITICAL)" },
    style: { background: "#312e81", color: "#e0e7ff", border: "1px solid #6366f1", borderRadius: "8px", fontSize: "12px", padding: "10px", fontWeight: "bold" },
  },
  {
    id: "3",
    position: { x: 600, y: 50 },
    data: { label: "DCE-105: LangGraph Supervisor" },
    style: { background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", padding: "10px" },
  },
  {
    id: "4",
    position: { x: 600, y: 170 },
    data: { label: "DCE-108: Verify Scaffolding" },
    style: { background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", padding: "10px" },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#6366f1" } },
  { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "#ec4899" } },
  { id: "e2-4", source: "2", target: "4", animated: true, style: { stroke: "#f59e0b" } },
];

export function DependencyFlow() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <GitGraph className="h-4 w-4 text-primary" />
            Interactive Dependency Directed Acyclic Graph (DAG)
          </h3>
          <p className="text-xs text-muted-foreground">
            Computed by AI Dependency Agent &bull; Critical Path highlighted in purple
          </p>
        </div>

        <Button variant="agent" size="sm" className="gap-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Detect Circular Deadlocks
        </Button>
      </div>

      <div className="h-[480px] w-full rounded-xl border border-border/80 bg-slate-950/60 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls className="!bg-card !border-border !fill-foreground" />
          <MiniMap
            className="!bg-card/80 !border-border"
            nodeColor={() => "#3b82f6"}
            maskColor="rgba(15, 23, 42, 0.7)"
          />
          <Background color="#334155" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}
