import Link from "next/link";
import { ArrowRight, Bot, ShieldCheck, GitGraph, Sparkles, Cpu, Layers } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/40 px-6 backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg">AI Project Manager</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
            Enterprise
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shadow-primary/25"
          >
            Launch Console
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-primary/10 blur-[130px]" />
          <div className="h-[350px] w-[350px] rounded-full bg-indigo-500/10 blur-[100px]" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-xs text-muted-foreground mb-8">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span>Multi-Agent SDLC Orchestration with LangGraph & Gemini</span>
        </div>

        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
          Autonomous Engineering Management with{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Human-in-the-Loop Governance
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Move beyond passive Jira clones. Deploy intelligent multi-agent swarms for automated PRD synthesis,
          task decomposition, dependency DAG mapping, capacity-aware sprint planning, and real-time risk auditing.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            Explore Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/approvals"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-6 py-3 text-base font-semibold text-foreground hover:bg-accent transition-all"
          >
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Human Approvals Center
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          <div className="glass-card rounded-xl p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 mb-4">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">LangGraph Agent Swarm</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Supervisor, Product, Task, Dependency, Sprint, Risk, and Review agents collaborating across a deterministic state machine.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Guarded Action Proposals</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Zero unauthorized database mutations. Agents propose actions via guarded tools; engineering leads review and approve with one click.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 mb-4">
              <GitGraph className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Dependency DAG & RAG</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              PostgreSQL with pgvector for context retrieval and dynamic interactive dependency graphs highlighting critical path blockers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        AI Project Manager Platform &bull; Built with Next.js, Prisma, FastAPI, LangGraph & Gemini
      </footer>
    </div>
  );
}
