import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

export const approvalService = {
  /**
   * Retrieves approvals for a project with status filtering.
   */
  async getProjectApprovals(projectId, filters = {}) {
    const { status } = filters;

    const where = {
      projectId,
      ...(status && { status }),
    };

    return await prisma.approval.findMany({
      where,
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
        agentRun: {
          select: { id: true, workflowId: true, agentId: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Retrieves a single approval by ID.
   */
  async getApprovalById(projectId, approvalId) {
    const approval = await prisma.approval.findFirst({
      where: { id: approvalId, projectId },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
        agentRun: true,
      },
    });

    if (!approval) {
      throw new NotFoundError("Approval proposal not found in this project.");
    }

    return approval;
  },

  /**
   * Creates a new approval proposal (e.g. from an AI agent or user).
   */
  async createApproval(projectId, userId, { actionType, payload, agentRunId = null }) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    const approval = await prisma.approval.create({
      data: {
        projectId,
        requestedById: userId,
        agentRunId: agentRunId || null,
        actionType,
        payload,
        status: "PENDING",
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: agentRunId ? "AGENT" : "USER",
      action: "APPROVAL_REQUESTED",
      entityType: "APPROVAL",
      entityId: approval.id,
      metadata: { actionType, agentRunId },
    });

    return approval;
  },

  /**
   * Approves a proposal and executes the underlying mutation within a database transaction.
   */
  async approveProposal(projectId, approvalId, reviewerUserId) {
    const approval = await prisma.approval.findFirst({
      where: { id: approvalId, projectId },
    });

    if (!approval) {
      throw new NotFoundError("Approval proposal not found in this project.");
    }

    if (approval.status !== "PENDING") {
      throw new ConflictError(
        `Cannot approve proposal with status '${approval.status}'. Must be PENDING.`
      );
    }

    const now = new Date();

    return await prisma.$transaction(async (tx) => {
      // 1. Mark approval as APPROVED
      const updatedApproval = await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: "APPROVED",
          reviewedById: reviewerUserId,
          reviewedAt: now,
        },
        include: {
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 2. Execute mutation based on actionType
      let executionResult = null;
      const { actionType, payload } = approval;

      switch (actionType) {
        case "CREATE_TASK": {
          executionResult = await tx.task.create({
            data: {
              projectId,
              title: payload.title,
              description: payload.description || null,
              priority: payload.priority || "MEDIUM",
              status: payload.status || "TODO",
              type: payload.type || "TASK",
              storyPoints: payload.storyPoints ?? 3,
              userStoryId: payload.userStoryId || null,
              assigneeId: payload.assigneeId || null,
              reporterId: reviewerUserId,
            },
          });
          break;
        }

        case "UPDATE_TASK": {
          if (!payload.taskId) {
            throw new ValidationError("taskId is required in payload for UPDATE_TASK.");
          }
          executionResult = await tx.task.update({
            where: { id: payload.taskId },
            data: {
              ...(payload.title !== undefined && { title: payload.title }),
              ...(payload.status !== undefined && { status: payload.status }),
              ...(payload.priority !== undefined && { priority: payload.priority }),
              ...(payload.description !== undefined && { description: payload.description }),
            },
          });
          break;
        }

        case "DELETE_TASK": {
          if (!payload.taskId) {
            throw new ValidationError("taskId is required in payload for DELETE_TASK.");
          }
          executionResult = await tx.task.delete({
            where: { id: payload.taskId },
          });
          break;
        }

        case "CREATE_SPRINT": {
          executionResult = await tx.sprint.create({
            data: {
              projectId,
              name: payload.name,
              goal: payload.goal || null,
              status: payload.status || "PLANNED",
              startDate: payload.startDate ? new Date(payload.startDate) : null,
              endDate: payload.endDate ? new Date(payload.endDate) : null,
              capacity: payload.capacity || 30,
            },
          });
          break;
        }

        case "RESOLVE_RISK": {
          if (!payload.riskId) {
            throw new ValidationError("riskId is required in payload for RESOLVE_RISK.");
          }
          executionResult = await tx.risk.update({
            where: { id: payload.riskId },
            data: { status: "RESOLVED" },
          });
          break;
        }

        default: {
          // Custom / extension mutation
          executionResult = { executed: true, actionType, payload };
        }
      }

      // 3. Log activity for the approval execution
      await tx.activityLog.create({
        data: {
          projectId,
          userId: reviewerUserId,
          actorType: "USER",
          action: "APPROVAL_APPROVED",
          entityType: "APPROVAL",
          entityId: approvalId,
          metadata: { actionType, executionResultId: executionResult?.id },
        },
      });

      return {
        approved: true,
        approval: updatedApproval,
        executionResult,
      };
    });
  },

  /**
   * Rejects a proposal with an optional reason.
   */
  async rejectProposal(projectId, approvalId, reviewerUserId, reason = null) {
    const approval = await prisma.approval.findFirst({
      where: { id: approvalId, projectId },
    });

    if (!approval) {
      throw new NotFoundError("Approval proposal not found in this project.");
    }

    if (approval.status !== "PENDING") {
      throw new ConflictError(
        `Cannot reject proposal with status '${approval.status}'. Must be PENDING.`
      );
    }

    const updated = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: "REJECTED",
        reviewedById: reviewerUserId,
        reviewedAt: new Date(),
        rejectionReason: reason || null,
      },
      include: {
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId: reviewerUserId,
      actorType: "USER",
      action: "APPROVAL_REJECTED",
      entityType: "APPROVAL",
      entityId: approvalId,
      metadata: { reason },
    });

    return {
      rejected: true,
      approval: updated,
    };
  },
};
