import { z } from "zod";

export const RiskSeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const RiskStatusEnum = z.enum([
  "OPEN",
  "MITIGATING",
  "RESOLVED",
  "ACCEPTED",
  "CLOSED",
]);

export const RiskActionStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const createRiskSchema = z.object({
  title: z
    .string({ required_error: "Risk title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  severity: RiskSeverityEnum.default("MEDIUM"),
  probability: z
    .number()
    .min(0.0, "Probability must be between 0.0 and 1.0")
    .max(1.0, "Probability must be between 0.0 and 1.0")
    .default(0.5),
  impact: z
    .number()
    .min(0.0, "Impact must be between 0.0 and 1.0")
    .max(1.0, "Impact must be between 0.0 and 1.0")
    .default(0.5),
  status: RiskStatusEnum.default("OPEN"),
  detectedBy: z.string().trim().max(100).optional().or(z.literal("")),
  ownerId: z.string().trim().nullable().optional(),
});

export const updateRiskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .nullable()
    .optional(),
  severity: RiskSeverityEnum.optional(),
  probability: z
    .number()
    .min(0.0, "Probability must be between 0.0 and 1.0")
    .max(1.0, "Probability must be between 0.0 and 1.0")
    .optional(),
  impact: z
    .number()
    .min(0.0, "Impact must be between 0.0 and 1.0")
    .max(1.0, "Impact must be between 0.0 and 1.0")
    .optional(),
  status: RiskStatusEnum.optional(),
  detectedBy: z.string().trim().max(100).nullable().optional(),
  ownerId: z.string().trim().nullable().optional(),
});

export const createRiskActionSchema = z.object({
  description: z
    .string({ required_error: "Action description is required" })
    .trim()
    .min(3, "Description must be at least 3 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  status: RiskActionStatusEnum.default("PENDING"),
  assignedToId: z.string().trim().nullable().optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateRiskActionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(3, "Description must be at least 3 characters")
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),
  status: RiskActionStatusEnum.optional(),
  assignedToId: z.string().trim().nullable().optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});
