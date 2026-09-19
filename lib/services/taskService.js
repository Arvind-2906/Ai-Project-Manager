import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

export const taskService = {
  /**
   * Retrieves all tasks for a project with filters and pagination.
   */
  async getProjectTasks(projectId, filters = {}, pagination = {}) {
    const {
      status,
      priority,
      type,
      assigneeId,
      userStoryId,
      parentTaskId,
      search,
    } = filters;

    const page = Math.max(1, parseInt(pagination.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit || 50, 10)));
    const skip = (page - 1) * limit;

    const where = {
      projectId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(type && { type }),
      ...(assigneeId && { assigneeId }),
      ...(userStoryId && { userStoryId }),
      ...(parentTaskId !== undefined && {
        parentTaskId: parentTaskId === "null" ? null : parentTaskId,
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
          reporter: {
            select: { id: true, name: true, email: true },
          },
          userStory: {
            select: { id: true, title: true },
          },
          _count: {
            select: { subtasks: true, comments: true },
          },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },

  /**
   * Retrieves a single task by ID with subtasks and dependencies.
   */
  async getTaskById(projectId, taskId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
        userStory: {
          select: { id: true, title: true, status: true },
        },
        subtasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        incomingDependencies: {
          include: {
            sourceTask: {
              select: { id: true, title: true, status: true, priority: true },
            },
          },
        },
        outgoingDependencies: {
          include: {
            targetTask: {
              select: { id: true, title: true, status: true, priority: true },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) {
      throw new NotFoundError("Task not found in this project.");
    }

    return task;
  },

  /**
   * Creates a new task or subtask with status side-effects.
   */
  async createTask(projectId, userId, data) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    // Verify parent task belongs to project
    if (data.parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: { id: data.parentTaskId, projectId },
        select: { id: true },
      });
      if (!parentTask) {
        throw new NotFoundError("Parent task not found in this project.");
      }
    }

    // Verify user story belongs to project
    if (data.userStoryId) {
      const story = await prisma.userStory.findFirst({
        where: {
          id: data.userStoryId,
          feature: { epic: { projectId } },
        },
        select: { id: true },
      });
      if (!story) {
        throw new NotFoundError("User story not found in this project.");
      }
    }

    // Status side-effects
    const status = data.status || "BACKLOG";
    const now = new Date();
    const startedAt = status === "IN_PROGRESS" ? now : null;
    const completedAt = status === "DONE" ? now : null;

    const task = await prisma.task.create({
      data: {
        projectId,
        title: data.title,
        description: data.description || null,
        status,
        priority: data.priority || "MEDIUM",
        type: data.type || "TASK",
        userStoryId: data.userStoryId || null,
        parentTaskId: data.parentTaskId || null,
        assigneeId: data.assigneeId || null,
        reporterId: userId,
        storyPoints: data.storyPoints ?? 3,
        estimatedHours: data.estimatedHours ?? null,
        actualHours: data.actualHours ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        startedAt,
        completedAt,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      metadata: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        type: task.type,
      },
    });

    return task;
  },

  /**
   * Updates a task with status side-effects and validations.
   */
  async updateTask(projectId, taskId, userId, data) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, projectId },
    });

    if (!existing) {
      throw new NotFoundError("Task not found in this project.");
    }

    // Verify parent task if updated
    if (data.parentTaskId) {
      if (data.parentTaskId === taskId) {
        throw new ValidationError("A task cannot be its own parent.");
      }
      const parentTask = await prisma.task.findFirst({
        where: { id: data.parentTaskId, projectId },
        select: { id: true },
      });
      if (!parentTask) {
        throw new NotFoundError("Parent task not found in this project.");
      }
    }

    // Status side-effects
    const updates = { ...data };
    if (data.status !== undefined) {
      const now = new Date();
      if (data.status === "IN_PROGRESS" && !existing.startedAt) {
        updates.startedAt = now;
      }
      if (data.status === "DONE") {
        updates.completedAt = now;
      } else if (existing.status === "DONE" && data.status !== "DONE") {
        updates.completedAt = null;
      }
    }

    if (data.dueDate !== undefined) {
      updates.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updates,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        reporter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const isStatusChange = data.status && data.status !== existing.status;
    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: isStatusChange ? "TASK_STATUS_CHANGED" : "TASK_UPDATED",
      entityType: "TASK",
      entityId: taskId,
      metadata: {
        status: updated.status,
        previousStatus: existing.status,
        changedFields: Object.keys(data),
      },
    });

    return updated;
  },

  /**
   * Dedicated status update method.
   */
  async updateTaskStatus(projectId, taskId, userId, status) {
    return this.updateTask(projectId, taskId, userId, { status });
  },

  /**
   * Deletes a task.
   */
  async deleteTask(projectId, taskId, userId) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { id: true, title: true },
    });

    if (!existing) {
      throw new NotFoundError("Task not found in this project.");
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "TASK_DELETED",
      entityType: "TASK",
      entityId: taskId,
      metadata: { title: existing.title },
    });

    return { deleted: true, id: taskId, projectId };
  },
};
