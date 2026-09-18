import { z } from "zod";

export const ProjectStatusEnum = z.enum([
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
]);

export const ProjectRoleEnum = z.enum([
  "PROJECT_MANAGER",
  "DEVELOPER",
  "DESIGNER",
  "TESTER",
  "VIEWER",
]);

export const createProjectSchema = z.object({
  organizationId: z
    .string({ required_error: "Organization ID is required" })
    .trim()
    .min(1, "Organization ID cannot be empty"),
  name: z
    .string({ required_error: "Project name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  key: z
    .string({ required_error: "Project key is required" })
    .trim()
    .toUpperCase()
    .min(2, "Key must be at least 2 characters")
    .max(10, "Key cannot exceed 10 characters")
    .regex(/^[A-Z0-9]+$/, "Key must contain only uppercase alphanumeric characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
  status: ProjectStatusEnum.default("PLANNING"),
  startDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .or(z.null()),
  targetDate: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .or(z.null()),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .nullable()
    .optional(),
  status: ProjectStatusEnum.optional(),
  startDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  targetDate: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const addProjectMemberSchema = z
  .object({
    userId: z.string().trim().optional(),
    email: z.string().trim().email("A valid user email is required").optional(),
    role: ProjectRoleEnum.default("DEVELOPER"),
  })
  .refine((data) => data.userId || data.email, {
    message: "Either userId or email must be provided",
  });
