import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

export const featureService = {
  /**
   * Retrieves all features across a project or filtered by epic/status/priority.
   */
  async getProjectFeatures(projectId, filters = {}) {
    const { epicId, status, priority, search } = filters;

    const where = {
      epic: { projectId },
      ...(epicId && { epicId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return await prisma.feature.findMany({
      where,
      include: {
        epic: {
          select: { id: true, title: true, status: true },
        },
        _count: {
          select: { userStories: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Retrieves features belonging to a specific epic.
   */
  async getFeaturesByEpic(projectId, epicId) {
    const epic = await prisma.epic.findFirst({
      where: { id: epicId, projectId },
      select: { id: true },
    });

    if (!epic) {
      throw new NotFoundError("Epic not found in this project.");
    }

    return await prisma.feature.findMany({
      where: { epicId },
      include: {
        _count: {
          select: { userStories: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Retrieves a single feature by ID with its parent epic and child stories.
   */
  async getFeatureById(projectId, featureId) {
    const feature = await prisma.feature.findFirst({
      where: {
        id: featureId,
        epic: { projectId },
      },
      include: {
        epic: {
          select: { id: true, title: true, status: true, projectId: true },
        },
        userStories: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, image: true },
            },
            _count: { select: { tasks: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { userStories: true },
        },
      },
    });

    if (!feature) {
      throw new NotFoundError("Feature not found in this project.");
    }

    return feature;
  },

  /**
   * Creates a feature linked to an epic within a project.
   */
  async createFeature(projectId, epicId, userId, data) {
    const targetEpicId = epicId || data.epicId;
    if (!targetEpicId) {
      throw new ValidationError("Epic ID is required to create a feature.");
    }

    const epic = await prisma.epic.findFirst({
      where: { id: targetEpicId, projectId },
      select: { id: true },
    });

    if (!epic) {
      throw new NotFoundError("Target epic not found in this project.");
    }

    const feature = await prisma.feature.create({
      data: {
        epicId: targetEpicId,
        title: data.title,
        description: data.description || null,
        status: data.status || "PLANNED",
        priority: data.priority || "MEDIUM",
      },
      include: {
        epic: {
          select: { id: true, title: true },
        },
        _count: {
          select: { userStories: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "FEATURE_CREATED",
      entityType: "FEATURE",
      entityId: feature.id,
      metadata: { title: feature.title, epicId: targetEpicId },
    });

    return feature;
  },

  /**
   * Updates an existing feature.
   */
  async updateFeature(projectId, featureId, userId, data) {
    const existing = await prisma.feature.findFirst({
      where: {
        id: featureId,
        epic: { projectId },
      },
      select: { id: true, epicId: true },
    });

    if (!existing) {
      throw new NotFoundError("Feature not found in this project.");
    }

    // If reparenting to another epic, verify destination epic belongs to same project
    if (data.epicId && data.epicId !== existing.epicId) {
      const targetEpic = await prisma.epic.findFirst({
        where: { id: data.epicId, projectId },
        select: { id: true },
      });
      if (!targetEpic) {
        throw new NotFoundError("Destination epic not found in this project.");
      }
    }

    const updated = await prisma.feature.update({
      where: { id: featureId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.epicId !== undefined && { epicId: data.epicId }),
      },
      include: {
        epic: {
          select: { id: true, title: true },
        },
        _count: {
          select: { userStories: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "FEATURE_UPDATED",
      entityType: "FEATURE",
      entityId: featureId,
      metadata: { changedFields: Object.keys(data), status: updated.status },
    });

    return updated;
  },

  /**
   * Deletes a feature and cascades to user stories.
   */
  async deleteFeature(projectId, featureId, userId) {
    const existing = await prisma.feature.findFirst({
      where: {
        id: featureId,
        epic: { projectId },
      },
      select: { id: true, title: true },
    });

    if (!existing) {
      throw new NotFoundError("Feature not found in this project.");
    }

    await prisma.feature.delete({
      where: { id: featureId },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "FEATURE_DELETED",
      entityType: "FEATURE",
      entityId: featureId,
      metadata: { title: existing.title },
    });

    return { deleted: true, id: featureId, projectId };
  },
};
