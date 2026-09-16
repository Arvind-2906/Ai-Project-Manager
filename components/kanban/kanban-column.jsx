import { TaskCard } from "@/components/task/task-card";
import { Plus } from "lucide-react";

export function KanbanColumn({ title, count, tasks = [], onTaskClick }) {
  return (
    <div className="flex w-80 flex-col shrink-0 rounded-xl border border-border/70 bg-card/40 p-3">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            {title}
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            {count}
          </span>
        </div>
        <button className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Task Stack */}
      <div className="flex flex-col gap-2.5 pt-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} {...task} onClick={() => onTaskClick?.(task)} />
        ))}
        {tasks.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground">
            No items in column
          </div>
        )}
      </div>
    </div>
  );
}
