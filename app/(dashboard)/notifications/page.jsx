import { Bell, ShieldAlert, Bot, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const notifications = [
    { id: 1, title: "Action Proposal Requires Lead Review", desc: "Dependency Agent proposed blocking rule for DCE-104.", time: "10 mins ago", unread: true, type: "APPROVAL" },
    { id: 2, title: "New Risk Identified: Cross-Region Partition", desc: "Risk Agent flagged RSK-01 during automated daily scan.", time: "42 mins ago", unread: true, type: "RISK" },
    { id: 3, title: "Sprint 4 Burndown Forecast Updated", desc: "Sprint Agent recalculated completion probability to 94.2%.", time: "2 hours ago", unread: false, type: "SPRINT" },
    { id: 4, title: "Task DCE-108 Scaffolding Completed", desc: "Elena marked DCE-108 done. Passed static analysis.", time: "4 hours ago", unread: false, type: "TASK" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications & Alerts</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Realtime updates streamed via Server-Sent Events (SSE) and Redis Pub/Sub.
          </p>
        </div>

        <button className="text-xs text-primary hover:underline font-medium">
          Mark all as read
        </button>
      </div>

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <div className="divide-y divide-border/60">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between p-4 transition-colors ${
                n.unread ? "bg-accent/20" : "hover:bg-accent/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    {n.title}
                    {n.unread && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                </div>
              </div>

              <span className="text-[11px] text-muted-foreground font-mono">{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
