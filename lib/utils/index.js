import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely with clsx and twMerge
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date timestamp into a human-readable string
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Returns color classes for task and risk priority levels
 */
export function getPriorityBadgeColor(priority) {
  switch (priority?.toUpperCase()) {
    case "CRITICAL":
    case "URGENT":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "HIGH":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "LOW":
    default:
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
}

/**
 * Returns color badge styling for agent execution statuses
 */
export function getAgentBadgeColor(agentType) {
  const colors = {
    SUPERVISOR: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    PRODUCT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    TASK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    DEPENDENCY: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    SPRINT: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    RISK: "bg-red-500/10 text-red-400 border-red-500/20",
    DEVELOPER: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    REVIEW: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    STANDUP: "bg-lime-500/10 text-lime-400 border-lime-500/20",
  };
  return colors[agentType?.toUpperCase()] || "bg-muted text-muted-foreground";
}
