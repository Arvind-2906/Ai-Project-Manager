import { z } from "zod";

export const ApprovalStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
]);

export const createApprovalSchema = z.object({
  actionType: z
    .string({ required_error: "Action type is required" })
    .trim()
    .min(2, "Action type must be at least 2 characters")
    .max(100, "Action type cannot exceed 100 characters"),
  payload: z.record(z.any(), { required_error: "Payload object is required" }),
  agentRunId: z.string().trim().nullable().optional(),
});

export const rejectApprovalSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(2000, "Rejection reason cannot exceed 2000 characters")
    .optional(),
});
