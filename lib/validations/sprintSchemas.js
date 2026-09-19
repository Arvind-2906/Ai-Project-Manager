import { z } from "zod";

export const SprintStatusEnum = z.enum([
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const createSprintSchema = z.object({
  name: z
    .string({ required_error: "Sprint name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  goal: z
    .string()
    .trim()
    .max(2000, "Goal cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
  status: SprintStatusEnum.default("PLANNED"),
  startDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .max(1000, "Capacity cannot exceed 1000")
    .default(30),
});

export const updateSprintSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  goal: z
    .string()
    .trim()
    .max(2000, "Goal cannot exceed 2000 characters")
    .nullable()
    .optional(),
  status: SprintStatusEnum.optional(),
  startDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  capacity: z
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .max(1000, "Capacity cannot exceed 1000")
    .optional(),
});

export const addSprintTasksSchema = z.object({
  taskIds: z
    .array(z.string().trim().min(1, "Task ID cannot be empty"))
    .min(1, "At least one task ID must be provided")
    .optional(),
  taskId: z.string().trim().min(1, "Task ID cannot be empty").optional(),
}).refine((data) => (data.taskIds && data.taskIds.length > 0) || data.taskId, {
  message: "Either taskId or taskIds array must be provided",
});
