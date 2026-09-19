import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ConflictError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

export const agentService = {
  /**
   * Retrieves all agents configured for a project.
   */
  async getProjectAgents(projectId) {
    return await prisma.agent.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { agentRuns: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Registers a new agent for a project.
   */
  async registerAgent(projectId, userId, data) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    const agent = await prisma.agent.create({
      data: {
        projectId,
        type: data.type,
        name: data.name,
        description: data.description || null,
        enabled: data.enabled ?? true,
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "AGENT_REGISTERED",
      entityType: "AGENT",
      entityId: agent.id,
      metadata: { type: agent.type, name: agent.name },
    });

    return agent;
  },

  /**
   * Updates an agent's configuration or toggles enabled status.
   */
  async updateAgent(projectId, agentId, userId, data) {
    const existing = await prisma.agent.findFirst({
      where: { id: agentId, projectId },
    });

    if (!existing) {
      throw new NotFoundError("Agent not found in this project.");
    }

    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "AGENT_UPDATED",
      entityType: "AGENT",
      entityId: agentId,
      metadata: { enabled: updated.enabled, changedFields: Object.keys(data) },
    });

    return updated;
  },

  // ---------------------------------------------------------------------------
  // AGENT RUNS
  // ---------------------------------------------------------------------------

  /**
   * Retrieves agent execution runs for a project with optional filters.
   */
  async getAgentRuns(projectId, filters = {}) {
    const { agentId, status, workflowId } = filters;

    const where = {
      projectId,
      ...(agentId && { agentId }),
      ...(status && { status }),
      ...(workflowId && { workflowId }),
    };

    return await prisma.agentRun.findMany({
      where,
      include: {
        agent: {
          select: { id: true, name: true, type: true },
        },
        _count: {
          select: { approvals: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 100,
    });
  },

  /**
   * Records the start of an agent execution run.
   */
  async createAgentRun(projectId, { agentId, workflowId, status = "RUNNING", input = null }) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, projectId },
      select: { id: true },
    });

    if (!agent) {
      throw new NotFoundError("Agent not found in this project.");
    }

    const run = await prisma.agentRun.create({
      data: {
        projectId,
        agentId,
        workflowId,
        status,
        input: input || undefined,
        startedAt: new Date(),
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    await logActivity({
      projectId,
      actorType: "AGENT",
      action: "AGENT_RUN_STARTED",
      entityType: "AGENT_RUN",
      entityId: run.id,
      metadata: { agentId, workflowId },
    });

    return run;
  },

  /**
   * Updates an agent run upon completion or failure.
   */
  async updateAgentRun(projectId, runId, data) {
    const existing = await prisma.agentRun.findFirst({
      where: { id: runId, projectId },
    });

    if (!existing) {
      throw new NotFoundError("Agent run not found in this project.");
    }

    const now = new Date();
    const completedAt =
      data.status === "COMPLETED" || data.status === "FAILED" || data.status === "CANCELLED"
        ? now
        : undefined;

    const executionTime =
      completedAt && existing.startedAt
        ? (completedAt.getTime() - new Date(existing.startedAt).getTime()) / 1000
        : data.executionTime;

    const updated = await prisma.agentRun.update({
      where: { id: runId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.output !== undefined && { output: data.output }),
        ...(data.error !== undefined && { error: data.error }),
        ...(data.tokenUsage !== undefined && { tokenUsage: data.tokenUsage }),
        ...(completedAt && { completedAt }),
        ...(executionTime !== undefined && { executionTime }),
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    await logActivity({
      projectId,
      actorType: "AGENT",
      action: `AGENT_RUN_${updated.status}`,
      entityType: "AGENT_RUN",
      entityId: runId,
      metadata: {
        status: updated.status,
        tokenUsage: updated.tokenUsage,
        executionTime: updated.executionTime,
      },
    });

    return updated;
  },
};
