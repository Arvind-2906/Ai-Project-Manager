import { z } from "zod";

// -----------------------------------------------------------------------------
// Shared & Model Enums
// -----------------------------------------------------------------------------

export const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const EpicStatusEnum = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const FeatureStatusEnum = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const UserStoryStatusEnum = z.enum([
  "BACKLOG",
  "READY",
  "IN_PROGRESS",
  "DONE",
]);

// -----------------------------------------------------------------------------
// Epic Schemas
// -----------------------------------------------------------------------------

export const createEpicSchema = z.object({
  title: z
    .string({ required_error: "Epic title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  status: EpicStatusEnum.default("PLANNED"),
  priority: TaskPriorityEnum.default("MEDIUM"),
});

export const updateEpicSchema = z.object({
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
  status: EpicStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
});

// -----------------------------------------------------------------------------
// Feature Schemas
// -----------------------------------------------------------------------------

export const createFeatureSchema = z.object({
  epicId: z
    .string()
    .trim()
    .min(1, "Epic ID cannot be empty")
    .optional(), // Can be supplied via URL path or body
  title: z
    .string({ required_error: "Feature title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  status: FeatureStatusEnum.default("PLANNED"),
  priority: TaskPriorityEnum.default("MEDIUM"),
});

export const updateFeatureSchema = z.object({
  epicId: z
    .string()
    .trim()
    .optional(),
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
  status: FeatureStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
});

// -----------------------------------------------------------------------------
// User Story Schemas
// -----------------------------------------------------------------------------

export const createUserStorySchema = z.object({
  featureId: z
    .string({ required_error: "Feature ID is required" })
    .trim()
    .min(1, "Feature ID cannot be empty")
    .optional(), // Can be supplied via URL path or body
  title: z
    .string({ required_error: "Story title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  acceptanceCriteria: z
    .any()
    .optional()
    .nullable(),
  priority: TaskPriorityEnum.default("MEDIUM"),
  status: UserStoryStatusEnum.default("BACKLOG"),
  storyPoints: z
    .number()
    .int("Story points must be an integer")
    .min(0, "Story points cannot be negative")
    .max(100, "Story points cannot exceed 100")
    .nullable()
    .optional(),
  assigneeId: z
    .string()
    .trim()
    .nullable()
    .optional(),
});

export const updateUserStorySchema = z.object({
  featureId: z
    .string()
    .trim()
    .optional(),
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
  acceptanceCriteria: z
    .any()
    .nullable()
    .optional(),
  priority: TaskPriorityEnum.optional(),
  status: UserStoryStatusEnum.optional(),
  storyPoints: z
    .number()
    .int("Story points must be an integer")
    .min(0, "Story points cannot be negative")
    .max(100, "Story points cannot exceed 100")
    .nullable()
    .optional(),
  assigneeId: z
    .string()
    .trim()
    .nullable()
    .optional(),
});
