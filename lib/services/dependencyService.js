import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

export const dependencyService = {
  /**
   * Retrieves all dependencies for a project with task details.
   */
  async getProjectDependencies(projectId) {
    return await prisma.dependency.findMany({
      where: { projectId },
      include: {
        sourceTask: {
          select: { id: true, title: true, status: true, priority: true },
        },
        targetTask: {
          select: { id: true, title: true, status: true, priority: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Creates a directed dependency between two tasks in the same project.
   */
  async createDependency(projectId, userId, { sourceTaskId, targetTaskId, type = "BLOCKS" }) {
    if (sourceTaskId === targetTaskId) {
      throw new ValidationError("A task cannot depend on itself.");
    }

    // Verify both tasks belong to the project
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: [sourceTaskId, targetTaskId] },
        projectId,
      },
      select: { id: true },
    });

    if (tasks.length !== 2) {
      throw new ValidationError("Both source and target tasks must exist within this project.");
    }

    // Check duplicate
    const existing = await prisma.dependency.findUnique({
      where: {
        sourceTaskId_targetTaskId: {
          sourceTaskId,
          targetTaskId,
        },
      },
    });

    if (existing) {
      throw new ConflictError("This dependency relationship already exists.");
    }

    // Cycle detection for BLOCKS dependency
    if (type === "BLOCKS") {
      const wouldCauseCycle = await this.detectCycle(sourceTaskId, targetTaskId);
      if (wouldCauseCycle) {
        throw new ValidationError(
          "Circular dependency detected. Adding this dependency would create a cycle in the task graph."
        );
      }
    }

    const dependency = await prisma.dependency.create({
      data: {
        projectId,
        sourceTaskId,
        targetTaskId,
        type,
        createdById: userId,
      },
      include: {
        sourceTask: {
          select: { id: true, title: true, status: true },
        },
        targetTask: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "DEPENDENCY_CREATED",
      entityType: "DEPENDENCY",
      entityId: dependency.id,
      metadata: { sourceTaskId, targetTaskId, type },
    });

    return dependency;
  },

  /**
   * Deletes a dependency.
   */
  async deleteDependency(projectId, dependencyId, userId) {
    const existing = await prisma.dependency.findFirst({
      where: { id: dependencyId, projectId },
      select: { id: true, sourceTaskId: true, targetTaskId: true },
    });

    if (!existing) {
      throw new NotFoundError("Dependency not found in this project.");
    }

    await prisma.dependency.delete({
      where: { id: dependencyId },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "DEPENDENCY_DELETED",
      entityType: "DEPENDENCY",
      entityId: dependencyId,
      metadata: {
        sourceTaskId: existing.sourceTaskId,
        targetTaskId: existing.targetTaskId,
      },
    });

    return { deleted: true, id: dependencyId, projectId };
  },

  /**
   * Graph Traversal: Retrieves direct dependencies for a task.
   */
  async getDirectDependencies(taskId) {
    const [blocking, blockedBy] = await Promise.all([
      // Tasks that this task blocks
      prisma.dependency.findMany({
        where: { sourceTaskId: taskId },
        include: { targetTask: true },
      }),
      // Tasks that block this task
      prisma.dependency.findMany({
        where: { targetTaskId: taskId },
        include: { sourceTask: true },
      }),
    ]);

    return {
      taskId,
      blocks: blocking.map((d) => d.targetTask),
      blockedBy: blockedBy.map((d) => d.sourceTask),
    };
  },

  /**
   * Graph Traversal: Retrieves all tasks that block this task (direct + transitive).
   */
  async getBlockingTasks(taskId) {
    const visited = new Set();
    const queue = [taskId];
    const blockingTasks = [];

    while (queue.length > 0) {
      const currentId = queue.shift();
      const dependencies = await prisma.dependency.findMany({
        where: {
          targetTaskId: currentId,
          type: "BLOCKS",
        },
        include: { sourceTask: true },
      });

      for (const dep of dependencies) {
        const blocker = dep.sourceTask;
        if (!visited.has(blocker.id)) {
          visited.add(blocker.id);
          blockingTasks.push(blocker);
          queue.push(blocker.id);
        }
      }
    }

    return blockingTasks;
  },

  /**
   * Graph Traversal: Retrieves all tasks blocked by this task (direct + transitive).
   */
  async getBlockedTasks(taskId) {
    const visited = new Set();
    const queue = [taskId];
    const blockedTasks = [];

    while (queue.length > 0) {
      const currentId = queue.shift();
      const dependencies = await prisma.dependency.findMany({
        where: {
          sourceTaskId: currentId,
          type: "BLOCKS",
        },
        include: { targetTask: true },
      });

      for (const dep of dependencies) {
        const blocked = dep.targetTask;
        if (!visited.has(blocked.id)) {
          visited.add(blocked.id);
          blockedTasks.push(blocked);
          queue.push(blocked.id);
        }
      }
    }

    return blockedTasks;
  },

  /**
   * Detects if adding sourceTaskId -> targetTaskId creates a cycle in the BLOCKS graph.
   * If sourceTaskId is already reachable from targetTaskId, adding source -> target creates a cycle!
   */
  async detectCycle(sourceTaskId, targetTaskId) {
    // If targetTaskId can already reach sourceTaskId, then adding source -> target creates a cycle.
    const visited = new Set();
    const queue = [targetTaskId];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === sourceTaskId) {
        return true;
      }

      visited.add(current);

      const nextDeps = await prisma.dependency.findMany({
        where: {
          sourceTaskId: current,
          type: "BLOCKS",
        },
        select: { targetTaskId: true },
      });

      for (const dep of nextDeps) {
        if (!visited.has(dep.targetTaskId)) {
          queue.push(dep.targetTaskId);
        }
      }
    }

    return false;
  },
};
