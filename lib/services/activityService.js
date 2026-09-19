import { prisma } from "@/lib/db/prisma";

/**
 * Creates an activity log entry for audited actions.
 * Never throws an unhandled error so it won't break primary business mutations.
 *
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string|null} params.userId
 * @param {"USER"|"AGENT"|"SYSTEM"} [params.actorType="USER"]
 * @param {string} params.action e.g. "PROJECT_CREATED", "TASK_STATUS_CHANGED"
 * @param {string} params.entityType e.g. "PROJECT", "TASK", "SPRINT"
 * @param {string} params.entityId
 * @param {Object} [params.metadata]
 * @returns {Promise<Object|null>}
 */
export async function logActivity({
  projectId,
  userId = null,
  actorType = "USER",
  action,
  entityType,
  entityId,
  metadata = null,
}) {
  try {
    return await prisma.activityLog.create({
      data: {
        projectId,
        userId,
        actorType,
        action,
        entityType,
        entityId,
        metadata: metadata || undefined,
      },
    });
  } catch (err) {
    console.warn(`[ActivityLog] Failed to record activity for ${action} on ${entityType}:${entityId}:`, err.message);
    return null;
  }
}

/**
 * Retrieves paginated activity logs for a project with filters.
 */
export async function getProjectActivities(projectId, filters = {}, pagination = {}) {
  const { actorType, entityType, entityId, userId, action } = filters;

  const page = Math.max(1, parseInt(pagination.page || 1, 10));
  const limit = Math.min(100, Math.max(1, parseInt(pagination.limit || 50, 10)));
  const skip = (page - 1) * limit;

  const where = {
    projectId,
    ...(actorType && { actorType }),
    ...(entityType && { entityType }),
    ...(entityId && { entityId }),
    ...(userId && { userId }),
    ...(action && { action }),
  };

  const [activities, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}
