"use client";

import { useState } from "react";
import { Bot, Send, Sparkles, CornerDownLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgentChat({ projectId = "proj-101" }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      agent: "Supervisor Agent",
      content:
        "Greetings! I am the LangGraph Supervisor Agent for this workspace. You can ask me to synthesize new feature specs, re-calculate critical path dependencies, run risk audits, or plan the next sprint.",
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const userMessage = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setIsGenerating(true);

    // Simulate multi-agent deliberation response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          agent: "Product & Task Agents",
          content:
            "I've initiated the multi-agent workflow. Product Agent has drafted the specification, and Task Agent decomposed it into 3 sub-tasks. Action proposals have been submitted to the Approvals Center for human lead confirmation.",
        },
      ]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[520px] rounded-xl border border-border/80 bg-card overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">AI Swarm Interactive Console</h4>
            <span className="text-[10px] text-muted-foreground">LangGraph StateGraph &bull; Gemini 1.5 Pro</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <ShieldCheck className="h-3 w-3" />
          <span>Guarded Execution</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 space-y-3 p-4 overflow-y-auto">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${
              m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            {m.agent && (
              <span className="text-[10px] font-mono text-primary mb-1 font-semibold">
                {m.agent}
              </span>
            )}
            <div
              className={`rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted/40 border border-border/60 text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-spin" />
            <span>LangGraph agents coordinating in state machine...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border/60 bg-background/50 p-3"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Command the swarm: e.g. 'Decompose distributed locking feature into tasks'..."
          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <Button type="submit" size="sm" disabled={!prompt.trim() || isGenerating} className="h-8 gap-1 text-xs">
          <span>Run</span>
          <CornerDownLeft className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
