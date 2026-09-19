import { prisma } from "@/lib/db/prisma";
import { NotFoundError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

/**
 * Attaches quantitative risk score (probability * impact) and summary metrics.
 */
function enrichRisk(risk) {
  const score = Math.round(risk.probability * risk.impact * 100) / 100;
  const actions = risk.actions || [];
  const totalActions = actions.length;
  const completedActions = actions.filter((a) => a.status === "COMPLETED").length;
  const pendingActions = actions.filter(
    (a) => a.status === "PENDING" || a.status === "IN_PROGRESS"
  ).length;

  return {
    ...risk,
    riskScore: score,
    actionSummary: {
      total: totalActions,
      completed: completedActions,
      pending: pendingActions,
    },
  };
}

export const riskService = {
  /**
   * Retrieves all risks for a project with risk score and action summaries.
   */
  async getProjectRisks(projectId, filters = {}) {
    const { severity, status, search } = filters;

    const where = {
      projectId,
      ...(severity && { severity }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const risks = await prisma.risk.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        actions: true,
      },
      orderBy: [{ severity: "desc" }, { probability: "desc" }, { createdAt: "desc" }],
    });

    return risks.map(enrichRisk);
  },

  /**
   * Retrieves a single risk by ID with actions.
   */
  async getRiskById(projectId, riskId) {
    const risk = await prisma.risk.findFirst({
      where: { id: riskId, projectId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        actions: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!risk) {
      throw new NotFoundError("Risk not found in this project.");
    }

    return enrichRisk(risk);
  },

  /**
   * Creates a new risk.
   */
  async createRisk(projectId, userId, data) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    const risk = await prisma.risk.create({
      data: {
        projectId,
        title: data.title,
        description: data.description || null,
        severity: data.severity || "MEDIUM",
        probability: data.probability ?? 0.5,
        impact: data.impact ?? 0.5,
        status: data.status || "OPEN",
        detectedBy: data.detectedBy || "USER",
        ownerId: data.ownerId || null,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        actions: true,
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "RISK_CREATED",
      entityType: "RISK",
      entityId: risk.id,
      metadata: {
        title: risk.title,
        severity: risk.severity,
        riskScore: Math.round(risk.probability * risk.impact * 100) / 100,
      },
    });

    return enrichRisk(risk);
  },

  /**
   * Updates an existing risk.
   */
  async updateRisk(projectId, riskId, userId, data) {
    const existing = await prisma.risk.findFirst({
      where: { id: riskId, projectId },
    });

    if (!existing) {
      throw new NotFoundError("Risk not found in this project.");
    }

    const updated = await prisma.risk.update({
      where: { id: riskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.severity !== undefined && { severity: data.severity }),
        ...(data.probability !== undefined && { probability: data.probability }),
        ...(data.impact !== undefined && { impact: data.impact }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.detectedBy !== undefined && { detectedBy: data.detectedBy }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        actions: true,
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "RISK_UPDATED",
      entityType: "RISK",
      entityId: riskId,
      metadata: {
        changedFields: Object.keys(data),
        status: updated.status,
      },
    });

    return enrichRisk(updated);
  },

  /**
   * Deletes a risk and cascades to risk actions.
   */
  async deleteRisk(projectId, riskId, userId) {
    const existing = await prisma.risk.findFirst({
      where: { id: riskId, projectId },
      select: { id: true, title: true },
    });

    if (!existing) {
      throw new NotFoundError("Risk not found in this project.");
    }

    await prisma.risk.delete({
      where: { id: riskId },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "RISK_DELETED",
      entityType: "RISK",
      entityId: riskId,
      metadata: { title: existing.title },
    });

    return { deleted: true, id: riskId, projectId };
  },

  // ---------------------------------------------------------------------------
  // RISK ACTIONS (Mitigations)
  // ---------------------------------------------------------------------------

  /**
   * Retrieves all actions for a specific risk.
   */
  async getRiskActions(projectId, riskId) {
    await this.getRiskById(projectId, riskId);

    return await prisma.riskAction.findMany({
      where: { riskId },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Adds an action/mitigation to a risk.
   */
  async createRiskAction(projectId, riskId, userId, data) {
    await this.getRiskById(projectId, riskId);

    const action = await prisma.riskAction.create({
      data: {
        riskId,
        description: data.description,
        status: data.status || "PENDING",
        assignedToId: data.assignedToId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "RISK_ACTION_CREATED",
      entityType: "RISK_ACTION",
      entityId: action.id,
      metadata: { riskId, description: action.description },
    });

    return action;
  },

  /**
   * Updates an existing risk action.
   */
  async updateRiskAction(projectId, riskId, actionId, userId, data) {
    await this.getRiskById(projectId, riskId);

    const existing = await prisma.riskAction.findFirst({
      where: { id: actionId, riskId },
    });

    if (!existing) {
      throw new NotFoundError("Risk action not found.");
    }

    const updated = await prisma.riskAction.update({
      where: { id: actionId },
      data: {
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "RISK_ACTION_UPDATED",
      entityType: "RISK_ACTION",
      entityId: actionId,
      metadata: { riskId, status: updated.status },
    });

    return updated;
  },

  /**
   * Deletes a risk action.
   */
  async deleteRiskAction(projectId, riskId, actionId, userId) {
    await this.getRiskById(projectId, riskId);

    const existing = await prisma.riskAction.findFirst({
      where: { id: actionId, riskId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError("Risk action not found.");
    }

    await prisma.riskAction.delete({
      where: { id: actionId },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "RISK_ACTION_DELETED",
      entityType: "RISK_ACTION",
      entityId: actionId,
      metadata: { riskId },
    });

    return { deleted: true, id: actionId, riskId, projectId };
  },
};
