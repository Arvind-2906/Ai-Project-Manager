import { z } from "zod";

export const TaskStatusEnum = z.enum([
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "TESTING",
  "DONE",
]);

export const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const TaskTypeEnum = z.enum([
  "FEATURE",
  "BUG",
  "TASK",
  "REFACTOR",
  "DOCUMENTATION",
  "TEST",
]);

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Task title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(10000, "Description cannot exceed 10000 characters")
    .optional()
    .or(z.literal("")),
  status: TaskStatusEnum.default("BACKLOG"),
  priority: TaskPriorityEnum.default("MEDIUM"),
  type: TaskTypeEnum.default("TASK"),
  userStoryId: z.string().trim().nullable().optional(),
  parentTaskId: z.string().trim().nullable().optional(),
  assigneeId: z.string().trim().nullable().optional(),
  storyPoints: z
    .number()
    .int("Story points must be an integer")
    .min(0, "Story points cannot be negative")
    .max(100, "Story points cannot exceed 100")
    .nullable()
    .optional(),
  estimatedHours: z
    .number()
    .min(0, "Estimated hours cannot be negative")
    .nullable()
    .optional(),
  actualHours: z
    .number()
    .min(0, "Actual hours cannot be negative")
    .nullable()
    .optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(10000, "Description cannot exceed 10000 characters")
    .nullable()
    .optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  type: TaskTypeEnum.optional(),
  userStoryId: z.string().trim().nullable().optional(),
  parentTaskId: z.string().trim().nullable().optional(),
  assigneeId: z.string().trim().nullable().optional(),
  storyPoints: z
    .number()
    .int("Story points must be an integer")
    .min(0, "Story points cannot be negative")
    .max(100, "Story points cannot exceed 100")
    .nullable()
    .optional(),
  estimatedHours: z
    .number()
    .min(0, "Estimated hours cannot be negative")
    .nullable()
    .optional(),
  actualHours: z
    .number()
    .min(0, "Actual hours cannot be negative")
    .nullable()
    .optional(),
  dueDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateTaskStatusSchema = z.object({
  status: TaskStatusEnum,
});
