import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

export const requirementService = {
  /**
   * Retrieves all requirements for a project with optional filters.
   */
  async getProjectRequirements(projectId, filters = {}) {
    const { type, status, priority, search } = filters;

    const where = {
      projectId,
      ...(type && { type }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return await prisma.requirement.findMany({
      where,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    });
  },

  /**
   * Creates a new requirement in a project.
   */
  async createRequirement(projectId, userId, data) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    const requirement = await prisma.requirement.create({
      data: {
        projectId,
        title: data.title,
        description: data.description || null,
        type: data.type || "FUNCTIONAL",
        priority: data.priority || "MEDIUM",
        status: data.status || "DRAFT",
        acceptanceCriteria: data.acceptanceCriteria || null,
        businessGoal: data.businessGoal || null,
        constraints: data.constraints || null,
        source: data.source || null,
        version: 1,
        createdById: userId,
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "REQUIREMENT_CREATED",
      entityType: "REQUIREMENT",
      entityId: requirement.id,
      metadata: {
        title: requirement.title,
        type: requirement.type,
        priority: requirement.priority,
      },
    });

    return requirement;
  },

  /**
   * Retrieves a single requirement by ID.
   */
  async getRequirementById(projectId, requirementId) {
    const requirement = await prisma.requirement.findFirst({
      where: {
        id: requirementId,
        projectId,
      },
    });

    if (!requirement) {
      throw new NotFoundError("Requirement not found.");
    }

    return requirement;
  },

  /**
   * Updates an existing requirement and increments version if substantive content changed.
   */
  async updateRequirement(projectId, requirementId, userId, data) {
    const existing = await prisma.requirement.findFirst({
      where: {
        id: requirementId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundError("Requirement not found.");
    }

    // Determine if version should increment
    let shouldIncrement = data.incrementVersion === true;
    if (data.incrementVersion === undefined) {
      const hasContentChanges =
        (data.title !== undefined && data.title !== existing.title) ||
        (data.description !== undefined && data.description !== existing.description) ||
        (data.acceptanceCriteria !== undefined &&
          JSON.stringify(data.acceptanceCriteria) !== JSON.stringify(existing.acceptanceCriteria)) ||
        (data.constraints !== undefined &&
          JSON.stringify(data.constraints) !== JSON.stringify(existing.constraints)) ||
        (data.businessGoal !== undefined && data.businessGoal !== existing.businessGoal);

      shouldIncrement = hasContentChanges;
    }

    const nextVersion = shouldIncrement ? existing.version + 1 : existing.version;

    const updated = await prisma.requirement.update({
      where: { id: requirementId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.acceptanceCriteria !== undefined && {
          acceptanceCriteria: data.acceptanceCriteria,
        }),
        ...(data.businessGoal !== undefined && { businessGoal: data.businessGoal }),
        ...(data.constraints !== undefined && { constraints: data.constraints }),
        ...(data.source !== undefined && { source: data.source }),
        version: nextVersion,
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "REQUIREMENT_UPDATED",
      entityType: "REQUIREMENT",
      entityId: requirementId,
      metadata: {
        version: updated.version,
        status: updated.status,
        changedFields: Object.keys(data),
      },
    });

    return updated;
  },

  /**
   * Deletes a requirement from the project.
   */
  async deleteRequirement(projectId, requirementId, userId) {
    const existing = await prisma.requirement.findFirst({
      where: {
        id: requirementId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundError("Requirement not found.");
    }

    await prisma.requirement.delete({
      where: { id: requirementId },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "REQUIREMENT_DELETED",
      entityType: "REQUIREMENT",
      entityId: requirementId,
      metadata: { title: existing.title },
    });

    return { deleted: true, id: requirementId, projectId };
  },
};
