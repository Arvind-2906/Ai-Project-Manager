import { z } from "zod";

export const AgentTypeEnum = z.enum([
  "SUPERVISOR",
  "PRODUCT",
  "TASK",
  "SPRINT",
  "RISK",
  "DEVELOPER",
  "CODE_REVIEW",
  "STANDUP",
]);

export const AgentRunStatusEnum = z.enum([
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export const registerAgentSchema = z.object({
  type: AgentTypeEnum,
  name: z
    .string({ required_error: "Agent name is required" })
    .trim()
    .min(2, "Agent name must be at least 2 characters")
    .max(100, "Agent name cannot exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
  enabled: z.boolean().default(true),
});

export const updateAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Agent name must be at least 2 characters")
    .max(100, "Agent name cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .nullable()
    .optional(),
  enabled: z.boolean().optional(),
});

export const createAgentRunSchema = z.object({
  agentId: z
    .string({ required_error: "Agent ID is required" })
    .trim()
    .min(1, "Agent ID cannot be empty"),
  workflowId: z
    .string({ required_error: "Workflow ID is required" })
    .trim()
    .min(1, "Workflow ID cannot be empty"),
  status: AgentRunStatusEnum.default("RUNNING"),
  input: z.any().optional().nullable(),
});

export const updateAgentRunSchema = z.object({
  status: AgentRunStatusEnum.optional(),
  output: z.any().optional().nullable(),
  error: z.string().trim().nullable().optional(),
  tokenUsage: z.number().int().min(0).optional(),
  executionTime: z.number().min(0).optional(),
});
