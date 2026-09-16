import { Bot, Sparkles, Cpu, Layers, GitGraph, Timer, ShieldAlert, Code2, Eye, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const agents = [
  { name: "Supervisor Agent", role: "Orchestrator & State Router", desc: "Monitors overall workflow execution, delegating tasks and enforcing LangGraph graph transitions.", icon: Bot, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { name: "Product Agent", role: "PRD & User Story Synthesizer", desc: "Transforms raw product ideas into well-formed specifications, user stories, and acceptance criteria.", icon: Layers, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { name: "Task Agent", role: "Automated Decomposer & Estimator", desc: "Breaks user stories into atomic engineering tasks and assigns Fibonacci story points.", icon: Sparkles, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Dependency Agent", role: "DAG & Blocker Mapper", desc: "Analyzes cross-task prerequisites, detects circular deadlocks, and calculates critical paths.", icon: GitGraph, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { name: "Sprint Agent", role: "Velocity & Capacity Planner", desc: "Balances team velocity with task commitments to generate optimal sprint candidate backlogs.", icon: Timer, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { name: "Risk Agent", role: "Technical Debt & Scope Auditor", desc: "Scans project health, delivery risks, and architectural bottlenecks continuously.", icon: ShieldAlert, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { name: "Developer Agent", role: "Implementation & Spec Architect", desc: "Formulates technical implementation blueprints, API contracts, and schema designs.", icon: Code2, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  { name: "Review Agent", role: "Automated Code & PR Reviewer", desc: "Conducts automated static analysis, security scans, and code quality audits against PRDs.", icon: Eye, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
  { name: "Standup Agent", role: "Async Status & Momentum Reporter", desc: "Synthesizes git commits, task transitions, and blocker reports into concise standups.", icon: MessageSquare, color: "text-lime-400 bg-lime-500/10 border-lime-500/20" },
];

export default function AgentsHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">LangGraph Multi-Agent Swarm Hub</h1>
          <p className="text-xs text-muted-foreground mt-1">
            9 specialized engineering agents executing guarded workflows powered by Google Gemini.
          </p>
        </div>

        <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10">
          Swarm Online &bull; Python 3.12 FastAPI Connected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.name} className="rounded-xl border border-border/80 bg-card p-5 space-y-3 hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${agent.color}`}>
                  <agent.icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">{agent.role}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {agent.desc}
            </p>

            <div className="border-t border-border/40 pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-mono">Engine: Gemini-1.5-Pro</span>
              <span className="text-emerald-400">Guarded Tool Caller</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
