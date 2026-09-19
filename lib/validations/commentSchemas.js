import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string({ required_error: "Comment content is required" })
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(5000, "Comment cannot exceed 5000 characters"),
  taskId: z.string().trim().nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string({ required_error: "Comment content is required" })
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(5000, "Comment cannot exceed 5000 characters"),
});
