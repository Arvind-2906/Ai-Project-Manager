import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

export const epicService = {
  /**
   * Retrieves all epics for a project with nested feature counts and summaries.
   */
  async getProjectEpics(projectId, filters = {}) {
    const { status, priority, search } = filters;

    const where = {
      projectId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return await prisma.epic.findMany({
      where,
      include: {
        features: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            _count: {
              select: { userStories: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { features: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Retrieves a single epic by ID.
   */
  async getEpicById(projectId, epicId) {
    const epic = await prisma.epic.findFirst({
      where: {
        id: epicId,
        projectId,
      },
      include: {
        features: {
          include: {
            userStories: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                storyPoints: true,
                assignee: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { features: true },
        },
      },
    });

    if (!epic) {
      throw new NotFoundError("Epic not found.");
    }

    return epic;
  },

  /**
   * Creates a new epic under a project.
   */
  async createEpic(projectId, userId, data) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    const epic = await prisma.epic.create({
      data: {
        projectId,
        title: data.title,
        description: data.description || null,
        status: data.status || "PLANNED",
        priority: data.priority || "MEDIUM",
      },
      include: {
        _count: { select: { features: true } },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "EPIC_CREATED",
      entityType: "EPIC",
      entityId: epic.id,
      metadata: { title: epic.title, status: epic.status, priority: epic.priority },
    });

    return epic;
  },

  /**
   * Updates an existing epic.
   */
  async updateEpic(projectId, epicId, userId, data) {
    const existing = await prisma.epic.findFirst({
      where: { id: epicId, projectId },
    });

    if (!existing) {
      throw new NotFoundError("Epic not found.");
    }

    const updated = await prisma.epic.update({
      where: { id: epicId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
      },
      include: {
        _count: { select: { features: true } },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "EPIC_UPDATED",
      entityType: "EPIC",
      entityId: epicId,
      metadata: { changedFields: Object.keys(data), status: updated.status },
    });

    return updated;
  },

  /**
   * Deletes an epic and cascades to features and user stories.
   */
  async deleteEpic(projectId, epicId, userId) {
    const existing = await prisma.epic.findFirst({
      where: { id: epicId, projectId },
    });

    if (!existing) {
      throw new NotFoundError("Epic not found.");
    }

    await prisma.epic.delete({
      where: { id: epicId },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "EPIC_DELETED",
      entityType: "EPIC",
      entityId: epicId,
      metadata: { title: existing.title },
    });

    return { deleted: true, id: epicId, projectId };
  },
};
