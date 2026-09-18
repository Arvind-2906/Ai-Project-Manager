import { z } from "zod";

export const RequirementTypeEnum = z.enum([
  "FUNCTIONAL",
  "NON_FUNCTIONAL",
  "BUSINESS",
  "TECHNICAL",
]);

export const RequirementPriorityEnum = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const RequirementStatusEnum = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
]);

export const createRequirementSchema = z.object({
  title: z
    .string({ required_error: "Requirement title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  type: RequirementTypeEnum.default("FUNCTIONAL"),
  priority: RequirementPriorityEnum.default("MEDIUM"),
  status: RequirementStatusEnum.default("DRAFT"),
  acceptanceCriteria: z
    .any()
    .optional()
    .nullable(),
  businessGoal: z
    .string()
    .trim()
    .max(3000, "Business goal cannot exceed 3000 characters")
    .optional()
    .or(z.literal("")),
  constraints: z
    .any()
    .optional()
    .nullable(),
  source: z
    .string()
    .trim()
    .max(200, "Source cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
});

export const updateRequirementSchema = z.object({
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
  type: RequirementTypeEnum.optional(),
  priority: RequirementPriorityEnum.optional(),
  status: RequirementStatusEnum.optional(),
  acceptanceCriteria: z
    .any()
    .nullable()
    .optional(),
  businessGoal: z
    .string()
    .trim()
    .max(3000, "Business goal cannot exceed 3000 characters")
    .nullable()
    .optional(),
  constraints: z
    .any()
    .nullable()
    .optional(),
  source: z
    .string()
    .trim()
    .max(200, "Source cannot exceed 200 characters")
    .nullable()
    .optional(),
  incrementVersion: z
    .boolean()
    .optional(),
});
