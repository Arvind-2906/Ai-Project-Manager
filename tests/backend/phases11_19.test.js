import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";

// Phase 11: Tasks
import { GET as listTasks, POST as createTask } from "@/app/api/projects/[projectId]/tasks/route";
import {
  GET as getTask,
  PATCH as updateTask,
  DELETE as deleteTask,
} from "@/app/api/projects/[projectId]/tasks/[taskId]/route";
import { POST as updateTaskStatus } from "@/app/api/projects/[projectId]/tasks/[taskId]/status/route";

// Phase 12: Sprints
import { GET as listSprints, POST as createSprint } from "@/app/api/projects/[projectId]/sprints/route";
import {
  GET as getSprint,
  PATCH as updateSprint,
  DELETE as deleteSprint,
} from "@/app/api/projects/[projectId]/sprints/[sprintId]/route";
import { POST as addSprintTasks } from "@/app/api/projects/[projectId]/sprints/[sprintId]/tasks/route";
import { DELETE as removeSprintTask } from "@/app/api/projects/[projectId]/sprints/[sprintId]/tasks/[taskId]/route";

// Phase 13: Dependencies
import { GET as listDeps, POST as createDep } from "@/app/api/projects/[projectId]/dependencies/route";
import { DELETE as deleteDep } from "@/app/api/projects/[projectId]/dependencies/[dependencyId]/route";
import { dependencyService } from "@/lib/services/dependencyService";

// Phase 14: Risks
import { GET as listRisks, POST as createRisk } from "@/app/api/projects/[projectId]/risks/route";
import {
  GET as getRisk,
  PATCH as updateRisk,
  DELETE as deleteRisk,
} from "@/app/api/projects/[projectId]/risks/[riskId]/route";
import {
  GET as listRiskActions,
  POST as createRiskAction,
} from "@/app/api/projects/[projectId]/risks/[riskId]/actions/route";
import {
  PATCH as updateRiskAction,
  DELETE as deleteRiskAction,
} from "@/app/api/projects/[projectId]/risks/[riskId]/actions/[actionId]/route";

// Phase 15: Comments
import { GET as listComments, POST as createComment } from "@/app/api/projects/[projectId]/comments/route";
import {
  PATCH as updateComment,
  DELETE as deleteComment,
} from "@/app/api/projects/[projectId]/comments/[commentId]/route";

// Phase 16: Activity Log
import { GET as listActivity } from "@/app/api/projects/[projectId]/activity/route";

// Phase 17: Notifications
import { GET as listNotifications } from "@/app/api/notifications/route";
import { PATCH as updateNotification } from "@/app/api/notifications/[notificationId]/route";
import { POST as markAllNotificationsRead } from "@/app/api/notifications/read-all/route";
import { notificationService } from "@/lib/services/notificationService";

// Phase 18: Approvals
import { GET as listApprovals, POST as createApproval } from "@/app/api/projects/[projectId]/approvals/route";
import { GET as getApproval } from "@/app/api/projects/[projectId]/approvals/[approvalId]/route";
import { POST as approveProposal } from "@/app/api/projects/[projectId]/approvals/[approvalId]/approve/route";
import { POST as rejectProposal } from "@/app/api/projects/[projectId]/approvals/[approvalId]/reject/route";

// Phase 19: Agents & Runs
import { GET as listAgents, POST as registerAgent } from "@/app/api/projects/[projectId]/agents/route";
import { PATCH as updateAgent } from "@/app/api/projects/[projectId]/agents/[agentId]/route";
import { GET as listAgentRuns, POST as createAgentRun } from "@/app/api/projects/[projectId]/agents/runs/route";
import { PATCH as updateAgentRun } from "@/app/api/projects/[projectId]/agents/runs/[runId]/route";

function createRequest(url, method = "GET", body = null, token = null) {
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (body) {
    headers.set("Content-Type", "application/json");
  }

  return new Request(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe("Phases 11 to 19: Task, Sprint, Dependency, Risk, Comment, Activity, Notification, Approval, and Agent APIs", () => {
  let testOrg, testProject;
  let pmUser, devUser, viewerUser, extUser;
  let pmToken, devToken, viewerToken, extToken;

  let taskAId, taskBId, taskCId, subtaskId;
  let sprintId;
  let dependencyId;
  let riskId, actionId;
  let commentId;
  let approvalId;
  let agentId, agentRunId;

  const testSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  beforeAll(async () => {
    // 1. Create Organization
    testOrg = await prisma.organization.create({
      data: {
        name: `Org Phase 11-19 ${testSuffix}`,
        slug: `org-11-19-${testSuffix}`,
      },
    });

    // 2. Create Users
    pmUser = await prisma.user.create({
      data: { name: "PM User", email: `pm_11_19_${testSuffix}@enterprise.io` },
    });
    devUser = await prisma.user.create({
      data: { name: "Dev User", email: `dev_11_19_${testSuffix}@enterprise.io` },
    });
    viewerUser = await prisma.user.create({
      data: { name: "Viewer User", email: `viewer_11_19_${testSuffix}@enterprise.io` },
    });
    extUser = await prisma.user.create({
      data: { name: "Ext User", email: `ext_11_19_${testSuffix}@enterprise.io` },
    });

    // 3. Create Session Tokens
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    pmToken = `tok_pm_1119_${testSuffix}`;
    devToken = `tok_dev_1119_${testSuffix}`;
    viewerToken = `tok_viewer_1119_${testSuffix}`;
    extToken = `tok_ext_1119_${testSuffix}`;

    await prisma.session.createMany({
      data: [
        { userId: pmUser.id, token: pmToken, expiresAt: tomorrow },
        { userId: devUser.id, token: devToken, expiresAt: tomorrow },
        { userId: viewerUser.id, token: viewerToken, expiresAt: tomorrow },
        { userId: extUser.id, token: extToken, expiresAt: tomorrow },
      ],
    });

    // 4. Assign Org Membership
    await prisma.organizationMember.createMany({
      data: [
        { organizationId: testOrg.id, userId: pmUser.id, role: "OWNER" },
        { organizationId: testOrg.id, userId: devUser.id, role: "MEMBER" },
        { organizationId: testOrg.id, userId: viewerUser.id, role: "VIEWER" },
      ],
    });

    // 5. Create Project
    testProject = await prisma.project.create({
      data: {
        organizationId: testOrg.id,
        name: `Phases 11-19 Project ${testSuffix}`,
        key: `P19_${Date.now().toString().slice(-5)}`,
        createdById: pmUser.id,
        members: {
          create: [
            { userId: pmUser.id, role: "PROJECT_MANAGER" },
            { userId: devUser.id, role: "DEVELOPER" },
            { userId: viewerUser.id, role: "VIEWER" },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    if (testProject) {
      // Clean up in reverse dependency order
      await prisma.notification.deleteMany({ where: { projectId: testProject.id } });
      await prisma.approval.deleteMany({ where: { projectId: testProject.id } });
      await prisma.agentRun.deleteMany({ where: { projectId: testProject.id } });
      await prisma.agent.deleteMany({ where: { projectId: testProject.id } });
      await prisma.activityLog.deleteMany({ where: { projectId: testProject.id } });
      await prisma.comment.deleteMany({ where: { projectId: testProject.id } });
      await prisma.riskAction.deleteMany({ where: { risk: { projectId: testProject.id } } });
      await prisma.risk.deleteMany({ where: { projectId: testProject.id } });
      await prisma.dependency.deleteMany({ where: { projectId: testProject.id } });
      await prisma.sprintTask.deleteMany({ where: { sprint: { projectId: testProject.id } } });
      await prisma.sprint.deleteMany({ where: { projectId: testProject.id } });
      await prisma.task.deleteMany({ where: { projectId: testProject.id } });
      await prisma.projectMember.deleteMany({ where: { projectId: testProject.id } });
      await prisma.project.delete({ where: { id: testProject.id } });
    }

    if (testOrg) {
      await prisma.organizationMember.deleteMany({ where: { organizationId: testOrg.id } });
      await prisma.organization.delete({ where: { id: testOrg.id } });
    }

    const userIds = [pmUser.id, devUser.id, viewerUser.id, extUser.id];
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    await prisma.$disconnect();
  });

  // ===========================================================================
  // PHASE 11: TASK MANAGEMENT & STATUS SIDE-EFFECTS
  // ===========================================================================
  describe("Phase 11: Task APIs & Business Logic", () => {
    it("POST /api/projects/[projectId]/tasks — creates task with initial status BACKLOG", async () => {
      const payload = {
        title: "Setup LangGraph State Machine",
        description: "Configure multi-agent supervisor graph nodes.",
        status: "BACKLOG",
        priority: "HIGH",
        storyPoints: 5,
        estimatedHours: 8,
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/tasks`,
        "POST",
        payload,
        devToken
      );
      const res = await createTask(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.status).toBe("BACKLOG");
      expect(json.data.startedAt).toBeNull();
      expect(json.data.completedAt).toBeNull();

      taskAId = json.data.id;
    });

    it("POST /api/projects/[projectId]/tasks/[taskId]/status — sets startedAt when moving to IN_PROGRESS", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/tasks/${taskAId}/status`,
        "POST",
        { status: "IN_PROGRESS" },
        devToken
      );
      const res = await updateTaskStatus(req, {
        params: { projectId: testProject.id, taskId: taskAId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("IN_PROGRESS");
      expect(json.data.startedAt).toBeDefined();
      expect(json.data.startedAt).not.toBeNull();
      expect(json.data.completedAt).toBeNull();
    });

    it("POST /api/projects/[projectId]/tasks/[taskId]/status — sets completedAt when moving to DONE", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/tasks/${taskAId}/status`,
        "POST",
        { status: "DONE" },
        devToken
      );
      const res = await updateTaskStatus(req, {
        params: { projectId: testProject.id, taskId: taskAId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("DONE");
      expect(json.data.completedAt).toBeDefined();
      expect(json.data.completedAt).not.toBeNull();
    });

    it("POST /api/projects/[projectId]/tasks/[taskId]/status — clears completedAt when leaving DONE", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/tasks/${taskAId}/status`,
        "POST",
        { status: "IN_REVIEW" },
        devToken
      );
      const res = await updateTaskStatus(req, {
        params: { projectId: testProject.id, taskId: taskAId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("IN_REVIEW");
      expect(json.data.completedAt).toBeNull();
    });

    it("POST /api/projects/[projectId]/tasks — creates subtask linked to parentTaskId", async () => {
      const payload = {
        title: "Write Unit Tests for State Machine",
        parentTaskId: taskAId,
        priority: "MEDIUM",
        storyPoints: 2,
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/tasks`,
        "POST",
        payload,
        devToken
      );
      const res = await createTask(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.parentTaskId).toBe(taskAId);

      subtaskId = json.data.id;
    });

    it("GET /api/projects/[projectId]/tasks/[taskId] — returns task with subtasks included", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/tasks/${taskAId}`,
        "GET",
        null,
        viewerToken
      );
      const res = await getTask(req, {
        params: { projectId: testProject.id, taskId: taskAId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(taskAId);
      expect(json.data.subtasks.length).toBeGreaterThanOrEqual(1);
      expect(json.data.subtasks[0].id).toBe(subtaskId);
    });
  });

  // ===========================================================================
  // PHASE 12: SPRINT MANAGEMENT & CAPACITY
  // ===========================================================================
  describe("Phase 12: Sprint APIs & Capacity Logic", () => {
    it("POST /api/projects/[projectId]/sprints — creates sprint with capacity", async () => {
      const payload = {
        name: "Sprint 1 — Core Multi-Agent Infrastructure",
        goal: "Deliver MVP autonomous supervisor and task decomposition agents.",
        startDate: "2026-10-01",
        endDate: "2026-10-14",
        capacity: 40,
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/sprints`,
        "POST",
        payload,
        pmToken
      );
      const res = await createSprint(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.capacity).toBe(40);

      sprintId = json.data.id;
    });

    it("POST /api/projects/[projectId]/sprints — validates date bounds (endDate >= startDate)", async () => {
      const invalidPayload = {
        name: "Invalid Date Sprint",
        startDate: "2026-10-15",
        endDate: "2026-10-01", // Earlier than start date!
        capacity: 20,
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/sprints`,
        "POST",
        invalidPayload,
        pmToken
      );
      const res = await createSprint(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.success).toBe(false);
    });

    it("POST /api/projects/[projectId]/sprints/[sprintId]/tasks — adds task to sprint and calculates metrics", async () => {
      const payload = { taskIds: [taskAId, subtaskId] };
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/sprints/${sprintId}/tasks`,
        "POST",
        payload,
        devToken
      );
      const res = await addSprintTasks(req, {
        params: { projectId: testProject.id, sprintId },
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.metrics.totalTasks).toBe(2);
      expect(json.data.metrics.totalStoryPoints).toBe(7); // 5 + 2
      expect(json.data.metrics.capacityUtilization).toBe(18); // round((7 / 40) * 100) = 18%
    });

    it("DELETE /api/projects/[projectId]/sprints/[sprintId]/tasks/[taskId] — removes task from sprint", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/sprints/${sprintId}/tasks/${subtaskId}`,
        "DELETE",
        null,
        devToken
      );
      const res = await removeSprintTask(req, {
        params: { projectId: testProject.id, sprintId, taskId: subtaskId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.removed).toBe(true);
    });
  });

  // ===========================================================================
  // PHASE 13: DEPENDENCY APIS & GRAPH TRAVERSAL
  // ===========================================================================
  describe("Phase 13: Dependency APIs & Graph Traversal", () => {
    beforeAll(async () => {
      // Create Task B and Task C for dependency testing
      const [tB, tC] = await Promise.all([
        prisma.task.create({
          data: {
            projectId: testProject.id,
            title: "Task B — Code Review Agent",
            status: "TODO",
          },
        }),
        prisma.task.create({
          data: {
            projectId: testProject.id,
            title: "Task C — Automated Deployment Agent",
            status: "TODO",
          },
        }),
      ]);
      taskBId = tB.id;
      taskCId = tC.id;
    });

    it("POST /api/projects/[projectId]/dependencies — creates a directed dependency (Task A BLOCKS Task B)", async () => {
      const payload = {
        sourceTaskId: taskAId,
        targetTaskId: taskBId,
        type: "BLOCKS",
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/dependencies`,
        "POST",
        payload,
        devToken
      );
      const res = await createDep(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.sourceTaskId).toBe(taskAId);
      expect(json.data.targetTaskId).toBe(taskBId);

      dependencyId = json.data.id;
    });

    it("POST /api/projects/[projectId]/dependencies — prevents circular dependency", async () => {
      // Create Task B BLOCKS Task C
      await dependencyService.createDependency(testProject.id, pmUser.id, {
        sourceTaskId: taskBId,
        targetTaskId: taskCId,
        type: "BLOCKS",
      });

      // Attempting Task C BLOCKS Task A should trigger cycle detection!
      const cyclicPayload = {
        sourceTaskId: taskCId,
        targetTaskId: taskAId,
        type: "BLOCKS",
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/dependencies`,
        "POST",
        cyclicPayload,
        devToken
      );
      const res = await createDep(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain("Circular dependency detected");
    });

    it("dependencyService.getBlockingTasks — traverses graph transitively", async () => {
      // Task C is blocked by Task B, which is blocked by Task A
      const blockers = await dependencyService.getBlockingTasks(taskCId);
      const blockerIds = blockers.map((b) => b.id);

      expect(blockerIds).toContain(taskBId);
      expect(blockerIds).toContain(taskAId);
    });

    it("DELETE /api/projects/[projectId]/dependencies/[dependencyId] — deletes dependency", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/dependencies/${dependencyId}`,
        "DELETE",
        null,
        devToken
      );
      const res = await deleteDep(req, {
        params: { projectId: testProject.id, dependencyId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deleted).toBe(true);
    });
  });

  // ===========================================================================
  // PHASE 14: RISK MANAGEMENT & SCORING
  // ===========================================================================
  describe("Phase 14: Risk APIs & Scoring", () => {
    it("POST /api/projects/[projectId]/risks — creates risk with quantitative score", async () => {
      const payload = {
        title: "Gemini API Rate Limiting during Concurrent Agent Runs",
        description: "Potential 429 quota exhaustion when multiple agents query Gemini simultaneously.",
        severity: "HIGH",
        probability: 0.8,
        impact: 0.75,
        detectedBy: "RISK_AGENT",
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/risks`,
        "POST",
        payload,
        pmToken
      );
      const res = await createRisk(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.riskScore).toBe(0.6); // 0.8 * 0.75 = 0.60

      riskId = json.data.id;
    });

    it("POST /api/projects/[projectId]/risks/[riskId]/actions — creates mitigation action", async () => {
      const payload = {
        description: "Implement exponential backoff with jitter and client-side token bucket.",
        status: "IN_PROGRESS",
        assignedToId: devUser.id,
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/risks/${riskId}/actions`,
        "POST",
        payload,
        devToken
      );
      const res = await createRiskAction(req, {
        params: { projectId: testProject.id, riskId },
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();

      actionId = json.data.id;
    });

    it("GET /api/projects/[projectId]/risks/[riskId] — returns risk with action summaries", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/risks/${riskId}`,
        "GET",
        null,
        viewerToken
      );
      const res = await getRisk(req, {
        params: { projectId: testProject.id, riskId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.actionSummary.total).toBe(1);
      expect(json.data.actionSummary.pending).toBe(1);
    });
  });

  // ===========================================================================
  // PHASE 15: COMMENT APIS
  // ===========================================================================
  describe("Phase 15: Comment APIs", () => {
    it("POST /api/projects/[projectId]/comments — creates a comment on a task", async () => {
      const payload = {
        taskId: taskAId,
        content: "Implemented exponential backoff retry mechanism.",
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/comments`,
        "POST",
        payload,
        devToken
      );
      const res = await createComment(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.content).toBe(payload.content);
      expect(json.data.userId).toBe(devUser.id);

      commentId = json.data.id;
    });

    it("PATCH /api/projects/[projectId]/comments/[commentId] — rejects other user editing comment", async () => {
      const payload = { content: "Unauthorized update attempt." };
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/comments/${commentId}`,
        "PATCH",
        payload,
        viewerToken // Not the author!
      );
      const res = await updateComment(req, {
        params: { projectId: testProject.id, commentId },
      });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
    });

    it("DELETE /api/projects/[projectId]/comments/[commentId] — allows PM to delete comment", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/comments/${commentId}`,
        "DELETE",
        null,
        pmToken
      );
      const res = await deleteComment(req, {
        params: { projectId: testProject.id, commentId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deleted).toBe(true);
    });
  });

  // ===========================================================================
  // PHASE 16: ACTIVITY LOG APIS
  // ===========================================================================
  describe("Phase 16: Activity Log APIs", () => {
    it("GET /api/projects/[projectId]/activity — returns paginated audit trail", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/activity?limit=10`,
        "GET",
        null,
        viewerToken
      );
      const res = await listActivity(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.pagination).toBeDefined();
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // PHASE 17: NOTIFICATION APIS
  // ===========================================================================
  describe("Phase 17: Notification APIs", () => {
    let notifId;

    beforeAll(async () => {
      const notif = await notificationService.createNotification({
        userId: devUser.id,
        projectId: testProject.id,
        type: "TASK_ASSIGNED",
        title: "New Task Assignment",
        message: "You have been assigned to 'Setup LangGraph State Machine'.",
      });
      notifId = notif.id;
    });

    it("GET /api/notifications — retrieves user notifications and unread count", async () => {
      const req = createRequest("http://localhost:3000/api/notifications", "GET", null, devToken);
      const res = await listNotifications(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.notifications.length).toBeGreaterThanOrEqual(1);
      expect(json.data.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it("PATCH /api/notifications/[notificationId] — marks notification as read", async () => {
      const req = createRequest(
        `http://localhost:3000/api/notifications/${notifId}`,
        "PATCH",
        { read: true },
        devToken
      );
      const res = await updateNotification(req, { params: { notificationId: notifId } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.read).toBe(true);
    });

    it("POST /api/notifications/read-all — bulk marks all notifications as read", async () => {
      const req = createRequest(
        "http://localhost:3000/api/notifications/read-all",
        "POST",
        {},
        devToken
      );
      const res = await markAllNotificationsRead(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  // ===========================================================================
  // PHASE 18: HUMAN-IN-THE-LOOP APPROVAL APIS
  // ===========================================================================
  describe("Phase 18: Human-in-the-Loop Approvals", () => {
    it("POST /api/projects/[projectId]/approvals — creates an action proposal", async () => {
      const payload = {
        actionType: "CREATE_TASK",
        payload: {
          title: "AI Generated Task: Implement Redis Caching",
          priority: "HIGH",
          storyPoints: 5,
        },
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        payload,
        devToken
      );
      const res = await createApproval(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("PENDING");

      approvalId = json.data.id;
    });

    it("POST /api/projects/[projectId]/approvals/[approvalId]/approve — executes proposal mutation in transaction", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${approvalId}/approve`,
        "POST",
        null,
        pmToken
      );
      const res = await approveProposal(req, {
        params: { projectId: testProject.id, approvalId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.approved).toBe(true);
      expect(json.data.approval.status).toBe("APPROVED");
      expect(json.data.executionResult.id).toBeDefined();

      // Verify task was created in DB
      const createdTask = await prisma.task.findUnique({
        where: { id: json.data.executionResult.id },
      });
      expect(createdTask).toBeDefined();
      expect(createdTask.title).toBe("AI Generated Task: Implement Redis Caching");
    });

    it("POST /api/projects/[projectId]/approvals/[approvalId]/reject — rejects proposal with reason", async () => {
      // 1. Create another proposal to reject
      const createReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        { actionType: "DELETE_TASK", payload: { taskId: taskAId } },
        devToken
      );
      const createRes = await createApproval(createReq, {
        params: { projectId: testProject.id },
      });
      const createJson = await createRes.json();
      const rejectTargetId = createJson.data.id;

      // 2. Reject it
      const rejectReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${rejectTargetId}/reject`,
        "POST",
        { reason: "Task is still required for sprint completion." },
        pmToken
      );
      const res = await rejectProposal(rejectReq, {
        params: { projectId: testProject.id, approvalId: rejectTargetId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.rejected).toBe(true);
      expect(json.data.approval.status).toBe("REJECTED");
      expect(json.data.approval.rejectionReason).toBe(
        "Task is still required for sprint completion."
      );
    });
  });

  // ===========================================================================
  // PHASE 19: AGENTS & RUN TRACKING
  // ===========================================================================
  describe("Phase 19: Agent & Agent Run APIs", () => {
    it("POST /api/projects/[projectId]/agents — registers a new AI agent", async () => {
      const payload = {
        type: "TASK",
        name: "Autonomous Task Decomposition Agent",
        description: "Decomposes user stories into atomic executable tasks.",
        enabled: true,
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/agents`,
        "POST",
        payload,
        pmToken
      );
      const res = await registerAgent(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.type).toBe("TASK");

      agentId = json.data.id;
    });

    it("POST /api/projects/[projectId]/agents/runs — records agent execution run", async () => {
      const payload = {
        agentId,
        workflowId: "task_decomposition_v1",
        status: "RUNNING",
        input: { userStoryId: "story_123" },
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/agents/runs`,
        "POST",
        payload,
        devToken
      );
      const res = await createAgentRun(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.status).toBe("RUNNING");

      agentRunId = json.data.id;
    });

    it("PATCH /api/projects/[projectId]/agents/runs/[runId] — updates run with completion metrics", async () => {
      const payload = {
        status: "COMPLETED",
        output: { tasksCreated: 3 },
        tokenUsage: 1450,
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/agents/runs/${agentRunId}`,
        "PATCH",
        payload,
        devToken
      );
      const res = await updateAgentRun(req, {
        params: { projectId: testProject.id, runId: agentRunId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("COMPLETED");
      expect(json.data.tokenUsage).toBe(1450);
      expect(json.data.completedAt).toBeDefined();
    });

    it("GET /api/projects/[projectId]/agents/runs — lists agent runs for the project", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/agents/runs`,
        "GET",
        null,
        viewerToken
      );
      const res = await listAgentRuns(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
