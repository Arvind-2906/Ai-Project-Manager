import { prisma } from "@/lib/db/prisma";
import { NotFoundError, AuthorizationError, ValidationError } from "@/lib/auth/errors";

export const commentService = {
  /**
   * Retrieves comments for a project, optionally filtered by task.
   */
  async getProjectComments(projectId, filters = {}) {
    const { taskId } = filters;

    const where = {
      projectId,
      ...(taskId && { taskId }),
    };

    return await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Creates a comment on a project or specific task.
   */
  async createComment(projectId, userId, data) {
    if (data.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: data.taskId, projectId },
        select: { id: true },
      });
      if (!task) {
        throw new NotFoundError("Task not found in this project.");
      }
    }

    return await prisma.comment.create({
      data: {
        projectId,
        taskId: data.taskId || null,
        userId,
        content: data.content,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  },

  /**
   * Updates an existing comment (author only).
   */
  async updateComment(projectId, commentId, userId, data) {
    const existing = await prisma.comment.findFirst({
      where: { id: commentId, projectId },
    });

    if (!existing) {
      throw new NotFoundError("Comment not found in this project.");
    }

    if (existing.userId !== userId) {
      throw new AuthorizationError("You can only edit your own comments.");
    }

    return await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: data.content,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  },

  /**
   * Deletes a comment (author or project manager).
   */
  async deleteComment(projectId, commentId, userId, isProjectManager = false) {
    const existing = await prisma.comment.findFirst({
      where: { id: commentId, projectId },
      select: { id: true, userId: true },
    });

    if (!existing) {
      throw new NotFoundError("Comment not found in this project.");
    }

    if (existing.userId !== userId && !isProjectManager) {
      throw new AuthorizationError(
        "You do not have permission to delete this comment."
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return { deleted: true, id: commentId, projectId };
  },
};
