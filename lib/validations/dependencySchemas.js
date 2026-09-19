import { z } from "zod";

export const DependencyTypeEnum = z.enum(["BLOCKS", "BLOCKED_BY", "RELATES_TO"]);

export const createDependencySchema = z
  .object({
    sourceTaskId: z
      .string({ required_error: "Source task ID is required" })
      .trim()
      .min(1, "Source task ID cannot be empty"),
    targetTaskId: z
      .string({ required_error: "Target task ID is required" })
      .trim()
      .min(1, "Target task ID cannot be empty"),
    type: DependencyTypeEnum.default("BLOCKS"),
  })
  .refine((data) => data.sourceTaskId !== data.targetTaskId, {
    message: "A task cannot depend on itself (source and target must be different)",
    path: ["targetTaskId"],
  });
