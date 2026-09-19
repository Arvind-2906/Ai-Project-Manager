import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

/**
 * Calculates sprint metrics (progress, story points, capacity utilization).
 */
function calculateSprintMetrics(sprint) {
  const sprintTasks = sprint.sprintTasks || [];
  const totalTasks = sprintTasks.length;
  let completedTasks = 0;
  let totalStoryPoints = 0;
  let completedStoryPoints = 0;

  for (const st of sprintTasks) {
    const task = st.task;
    if (!task) continue;

    const points = task.storyPoints || 0;
    totalStoryPoints += points;

    if (task.status === "DONE") {
      completedTasks += 1;
      completedStoryPoints += points;
    }
  }

  const progressPercentage =
    totalStoryPoints > 0
      ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
      : totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const capacityUtilization =
    sprint.capacity > 0
      ? Math.round((totalStoryPoints / sprint.capacity) * 100)
      : 0;

  return {
    ...sprint,
    metrics: {
      totalTasks,
      completedTasks,
      totalStoryPoints,
      completedStoryPoints,
      progressPercentage,
      capacityUtilization,
    },
  };
}

export const sprintService = {
  /**
   * Retrieves all sprints for a project with progress and capacity metrics.
   */
  async getProjectSprints(projectId) {
    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      include: {
        sprintTasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                storyPoints: true,
              },
            },
          },
        },
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    });

    return sprints.map(calculateSprintMetrics);
  },

  /**
   * Retrieves a single sprint by ID with detailed tasks and metrics.
   */
  async getSprintById(projectId, sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
      include: {
        sprintTasks: {
          include: {
            task: {
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, image: true },
                },
                userStory: {
                  select: { id: true, title: true },
                },
              },
            },
          },
          orderBy: { addedAt: "asc" },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundError("Sprint not found in this project.");
    }

    return calculateSprintMetrics(sprint);
  },

  /**
   * Creates a new sprint.
   */
  async createSprint(projectId, userId, data) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    if (data.startDate && data.endDate) {
      if (new Date(data.endDate) < new Date(data.startDate)) {
        throw new ValidationError("Sprint end date cannot be earlier than start date.");
      }
    }

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name: data.name,
        goal: data.goal || null,
        status: data.status || "PLANNED",
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        capacity: data.capacity || 30,
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "SPRINT_CREATED",
      entityType: "SPRINT",
      entityId: sprint.id,
      metadata: { name: sprint.name, capacity: sprint.capacity },
    });

    return calculateSprintMetrics(sprint);
  },

  /**
   * Updates an existing sprint.
   */
  async updateSprint(projectId, sprintId, userId, data) {
    const existing = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
    });

    if (!existing) {
      throw new NotFoundError("Sprint not found in this project.");
    }

    const startDate =
      data.startDate !== undefined
        ? data.startDate
          ? new Date(data.startDate)
          : null
        : existing.startDate;
    const endDate =
      data.endDate !== undefined
        ? data.endDate
          ? new Date(data.endDate)
          : null
        : existing.endDate;

    if (startDate && endDate && endDate < startDate) {
      throw new ValidationError("Sprint end date cannot be earlier than start date.");
    }

    const updated = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.goal !== undefined && { goal: data.goal }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.startDate !== undefined && { startDate }),
        ...(data.endDate !== undefined && { endDate }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
      },
      include: {
        sprintTasks: {
          include: {
            task: true,
          },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "SPRINT_UPDATED",
      entityType: "SPRINT",
      entityId: sprintId,
      metadata: { changedFields: Object.keys(data), status: updated.status },
    });

    return calculateSprintMetrics(updated);
  },

  /**
   * Deletes a sprint.
   */
  async deleteSprint(projectId, sprintId, userId) {
    const existing = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
      select: { id: true, name: true },
    });

    if (!existing) {
      throw new NotFoundError("Sprint not found in this project.");
    }

    await prisma.sprint.delete({
      where: { id: sprintId },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "SPRINT_DELETED",
      entityType: "SPRINT",
      entityId: sprintId,
      metadata: { name: existing.name },
    });

    return { deleted: true, id: sprintId, projectId };
  },

  /**
   * Adds one or more tasks to a sprint.
   */
  async addTasksToSprint(projectId, sprintId, userId, taskIds) {
    const sprint = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
      select: { id: true },
    });

    if (!sprint) {
      throw new NotFoundError("Sprint not found in this project.");
    }

    const ids = Array.isArray(taskIds) ? taskIds : [taskIds];

    // Verify tasks belong to this project
    const validTasks = await prisma.task.findMany({
      where: {
        id: { in: ids },
        projectId,
      },
      select: { id: true },
    });

    if (validTasks.length !== ids.length) {
      throw new ValidationError("One or more tasks do not belong to this project.");
    }

    // Upsert sprint tasks to avoid duplicate error
    await prisma.$transaction(
      ids.map((taskId) =>
        prisma.sprintTask.upsert({
          where: {
            sprintId_taskId: {
              sprintId,
              taskId,
            },
          },
          update: {},
          create: {
            sprintId,
            taskId,
          },
        })
      )
    );

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "SPRINT_TASKS_ADDED",
      entityType: "SPRINT",
      entityId: sprintId,
      metadata: { taskCount: ids.length, taskIds: ids },
    });

    return this.getSprintById(projectId, sprintId);
  },

  /**
   * Removes a task from a sprint.
   */
  async removeTaskFromSprint(projectId, sprintId, userId, taskId) {
    const sprint = await prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
      select: { id: true },
    });

    if (!sprint) {
      throw new NotFoundError("Sprint not found in this project.");
    }

    const sprintTask = await prisma.sprintTask.findUnique({
      where: {
        sprintId_taskId: {
          sprintId,
          taskId,
        },
      },
    });

    if (!sprintTask) {
      throw new NotFoundError("Task is not part of this sprint.");
    }

    await prisma.sprintTask.delete({
      where: {
        sprintId_taskId: {
          sprintId,
          taskId,
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "SPRINT_TASK_REMOVED",
      entityType: "SPRINT",
      entityId: sprintId,
      metadata: { taskId },
    });

    return { removed: true, sprintId, taskId };
  },
};
