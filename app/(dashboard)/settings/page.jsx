import { Settings, Key, Database, Bot, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-border/60 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Platform Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure API integrations, Gemini LLM model weights, and Redis caching.
        </p>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Key className="h-4 w-4 text-blue-400" />
          LLM & Agent Configuration
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              defaultValue="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-foreground font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Active Gemini Model
            </label>
            <select
              defaultValue="gemini-1.5-pro"
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-foreground"
            >
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended for Complex Reasoning & Architecture)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Optimized for High Throughput & Realtime Chat)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">
              Python AI Backend Microservice URL
            </label>
            <input
              type="text"
              defaultValue="http://localhost:8000"
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-foreground font-mono"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button size="sm" className="gap-1.5 text-xs">
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
