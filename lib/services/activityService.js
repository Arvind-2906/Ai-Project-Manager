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
