import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

export const storyService = {
  /**
   * Retrieves all user stories for a project with filters.
   */
  async getProjectStories(projectId, filters = {}) {
    const { featureId, status, priority, assigneeId, search } = filters;

    const where = {
      feature: {
        epic: {
          projectId,
        },
      },
      ...(featureId && { featureId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return await prisma.userStory.findMany({
      where,
      include: {
        feature: {
          select: {
            id: true,
            title: true,
            epic: {
              select: { id: true, title: true },
            },
          },
        },
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Retrieves a single user story by ID.
   */
  async getStoryById(projectId, storyId) {
    const story = await prisma.userStory.findFirst({
      where: {
        id: storyId,
        feature: {
          epic: {
            projectId,
          },
        },
      },
      include: {
        feature: {
          include: {
            epic: {
              select: { id: true, title: true, projectId: true },
            },
          },
        },
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            storyPoints: true,
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!story) {
      throw new NotFoundError("User story not found in this project.");
    }

    return story;
  },

  /**
   * Creates a new user story linked to a feature.
   */
  async createStory(projectId, userId, data) {
    const { featureId } = data;
    if (!featureId) {
      throw new ValidationError("Feature ID is required to create a user story.");
    }

    // Verify feature belongs to this project
    const feature = await prisma.feature.findFirst({
      where: {
        id: featureId,
        epic: { projectId },
      },
      select: { id: true },
    });

    if (!feature) {
      throw new NotFoundError("Feature not found in this project.");
    }

    // If assignee provided, verify user exists
    if (data.assigneeId) {
      const assigneeExists = await prisma.user.findUnique({
        where: { id: data.assigneeId },
        select: { id: true },
      });
      if (!assigneeExists) {
        throw new NotFoundError("Assignee user not found.");
      }
    }

    const story = await prisma.userStory.create({
      data: {
        featureId,
        title: data.title,
        description: data.description || null,
        acceptanceCriteria: data.acceptanceCriteria || null,
        priority: data.priority || "MEDIUM",
        status: data.status || "BACKLOG",
        storyPoints: data.storyPoints ?? null,
        assigneeId: data.assigneeId || null,
      },
      include: {
        feature: {
          select: { id: true, title: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "STORY_CREATED",
      entityType: "USER_STORY",
      entityId: story.id,
      metadata: {
        title: story.title,
        featureId: story.featureId,
        status: story.status,
        storyPoints: story.storyPoints,
      },
    });

    return story;
  },

  /**
   * Updates an existing user story.
   */
  async updateStory(projectId, storyId, userId, data) {
    const existing = await prisma.userStory.findFirst({
      where: {
        id: storyId,
        feature: {
          epic: { projectId },
        },
      },
      select: {
        id: true,
        status: true,
        featureId: true,
      },
    });

    if (!existing) {
      throw new NotFoundError("User story not found in this project.");
    }

    // If reparenting to another feature, verify destination feature belongs to project
    if (data.featureId && data.featureId !== existing.featureId) {
      const targetFeature = await prisma.feature.findFirst({
        where: {
          id: data.featureId,
          epic: { projectId },
        },
        select: { id: true },
      });
      if (!targetFeature) {
        throw new NotFoundError("Destination feature not found in this project.");
      }
    }

    // If assignee provided, verify user exists
    if (data.assigneeId) {
      const assigneeExists = await prisma.user.findUnique({
        where: { id: data.assigneeId },
        select: { id: true },
      });
      if (!assigneeExists) {
        throw new NotFoundError("Assignee user not found.");
      }
    }

    const updated = await prisma.userStory.update({
      where: { id: storyId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.acceptanceCriteria !== undefined && {
          acceptanceCriteria: data.acceptanceCriteria,
        }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.storyPoints !== undefined && { storyPoints: data.storyPoints }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.featureId !== undefined && { featureId: data.featureId }),
      },
      include: {
        feature: {
          select: { id: true, title: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    const action =
      data.status && data.status !== existing.status
        ? "STORY_STATUS_CHANGED"
        : "STORY_UPDATED";

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action,
      entityType: "USER_STORY",
      entityId: storyId,
      metadata: {
        status: updated.status,
        previousStatus: existing.status,
        changedFields: Object.keys(data),
      },
    });

    return updated;
  },

  /**
   * Deletes a user story.
   */
  async deleteStory(projectId, storyId, userId) {
    const existing = await prisma.userStory.findFirst({
      where: {
        id: storyId,
        feature: {
          epic: { projectId },
        },
      },
      select: { id: true, title: true },
    });

    if (!existing) {
      throw new NotFoundError("User story not found in this project.");
    }

    await prisma.userStory.delete({
      where: { id: storyId },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "STORY_DELETED",
      entityType: "USER_STORY",
      entityId: storyId,
      metadata: { title: existing.title },
    });

    return { deleted: true, id: storyId, projectId };
  },
};
