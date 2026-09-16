"use client";

import { Bell, Search, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      {/* Global Search Bar */}
      <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm text-muted-foreground focus-within:border-primary">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Semantic search tasks, PRDs, code embeddings (pgvector)..."
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-xs"
        />
        <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      {/* Action Controls & User Avatar */}
      <div className="flex items-center gap-4">
        <Link
          href="/approvals"
          className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Pending Approvals (3)</span>
        </Link>

        <Link
          href="/notifications"
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
        </Link>

        <div className="flex items-center gap-2.5 border-l border-border pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-sm">
            AK
          </div>
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-xs font-medium text-foreground">Arvind Kumar</span>
            <span className="text-[10px] text-muted-foreground">Staff Engineer</span>
          </div>
        </div>
      </div>
    </header>
  );
}
