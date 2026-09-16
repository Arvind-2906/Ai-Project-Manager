"use client";

import { useState } from "react";
import { KanbanColumn } from "./kanban-column";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { Sparkles, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialColumns = {
  backlog: [
    { id: "DCE-101", title: "Evaluate TLS 1.3 zero-RTT handshake for cluster peer protocol", priority: "MEDIUM", points: 3, agentAssisted: true },
    { id: "DCE-102", title: "Add OpenTelemetry distributed tracing spans to replication worker", priority: "LOW", points: 2, agentAssisted: false },
  ],
  todo: [
    { id: "DCE-103", title: "Configure pgvector vector store collection for PRD semantic search", priority: "HIGH", points: 5, agentAssisted: true },
    { id: "DCE-104", title: "Implement Raft Log Compaction with Snapshot Stream", priority: "CRITICAL", points: 8, agentAssisted: true },
  ],
  in_progress: [
    { id: "DCE-105", title: "Develop LangGraph Supervisor state routing machine", priority: "HIGH", points: 8, agentAssisted: true },
    { id: "DCE-106", title: "Implement guarded mutation proposal approval endpoint", priority: "HIGH", points: 5, agentAssisted: true },
  ],
  review: [
    { id: "DCE-107", title: "Audit Better Auth middleware token validation in Edge runtimes", priority: "MEDIUM", points: 3, agentAssisted: false },
  ],
  done: [
    { id: "DCE-108", title: "Bootstrap Next.js, Prisma schema, and FastAPI microservice scaffolding", priority: "CRITICAL", points: 5, agentAssisted: true },
  ],
};

export function KanbanBoard() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Kanban Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Group by Agent
          </Button>
        </div>

        <Button variant="agent" size="sm" className="gap-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Auto-Rebalance Sprint via Sprint Agent
        </Button>
      </div>

      {/* Columns Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        <KanbanColumn
          title="Backlog"
          count={initialColumns.backlog.length}
          tasks={initialColumns.backlog}
          onTaskClick={handleTaskClick}
        />
        <KanbanColumn
          title="To Do"
          count={initialColumns.todo.length}
          tasks={initialColumns.todo}
          onTaskClick={handleTaskClick}
        />
        <KanbanColumn
          title="In Progress"
          count={initialColumns.in_progress.length}
          tasks={initialColumns.in_progress}
          onTaskClick={handleTaskClick}
        />
        <KanbanColumn
          title="In Review (AI/Peer)"
          count={initialColumns.review.length}
          tasks={initialColumns.review}
          onTaskClick={handleTaskClick}
        />
        <KanbanColumn
          title="Done"
          count={initialColumns.done.length}
          tasks={initialColumns.done}
          onTaskClick={handleTaskClick}
        />
      </div>

      {/* Task Modal */}
      <TaskDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}
