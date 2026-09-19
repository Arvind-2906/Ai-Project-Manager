import { prisma } from "@/lib/db/prisma";
import { NotFoundError, AuthorizationError } from "@/lib/auth/errors";

export const notificationService = {
  /**
   * Retrieves notifications for a user with unread counts.
   */
  async getUserNotifications(userId, filters = {}) {
    const { read, projectId } = filters;

    const where = {
      userId,
      ...(read !== undefined && { read: read === "true" || read === true }),
      ...(projectId && { projectId }),
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, key: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.notification.count({
        where: {
          userId,
          read: false,
          ...(projectId && { projectId }),
        },
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  },

  /**
   * Creates a notification for a user.
   */
  async createNotification({ userId, projectId = null, type, title, message, metadata = null }) {
    return await prisma.notification.create({
      data: {
        userId,
        projectId,
        type,
        title,
        message,
        metadata: metadata || undefined,
      },
    });
  },

  /**
   * Marks a single notification as read or unread.
   */
  async updateNotificationRead(notificationId, userId, read = true) {
    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existing) {
      throw new NotFoundError("Notification not found.");
    }

    if (existing.userId !== userId) {
      throw new AuthorizationError("You do not have access to this notification.");
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read },
    });
  },

  /**
   * Bulk marks all notifications as read for a user.
   */
  async markAllAsRead(userId, projectId = null) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
        ...(projectId && { projectId }),
      },
      data: {
        read: true,
      },
    });

    return { updatedCount: result.count };
  },
};
