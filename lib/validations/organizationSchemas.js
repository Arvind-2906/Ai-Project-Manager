import { z } from "zod";

export const OrganizationRoleEnum = z.enum([
  "OWNER",
  "ADMIN",
  "PROJECT_MANAGER",
  "MEMBER",
  "VIEWER",
]);

export const createOrganizationSchema = z.object({
  name: z
    .string({ required_error: "Organization name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug cannot exceed 60 characters")
    .optional(),
  logo: z
    .string()
    .url("Logo must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug cannot exceed 60 characters")
    .optional(),
  logo: z
    .string()
    .url("Logo must be a valid URL")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export const addOrganizationMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .email("A valid user email is required")
    .optional(),
  userId: z
    .string()
    .trim()
    .optional(),
  role: OrganizationRoleEnum.default("MEMBER"),
}).refine(
  (data) => data.email || data.userId,
  { message: "Either email or userId must be provided" }
);
