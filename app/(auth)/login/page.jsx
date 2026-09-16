import Link from "next/link";
import { Bot, ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Sign in to AI Project Manager
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your credentials to access your autonomous engineering workspaces
          </p>
        </div>

        <div className="glass-panel rounded-xl p-8 shadow-xl">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="engineer@enterprise.io"
                  defaultValue="lead@enterprise.io"
                  className="w-full rounded-lg border border-border bg-background/50 pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-foreground">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  defaultValue="password123"
                  className="w-full rounded-lg border border-border bg-background/50 pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <Link
              href="/dashboard"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              Sign In to Console
              <ArrowRight className="h-4 w-4" />
            </Link>
          </form>

          <div className="mt-6 border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
            Don&apos;t have an enterprise account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Register organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
