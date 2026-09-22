import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { validateInternalServiceRequest } from "@/lib/auth/internal";
import { requireAuth } from "@/lib/utils/permissions";
import { GET as listApprovals, POST as createApproval } from "@/app/api/projects/[projectId]/approvals/route";
import { POST as approveProposal } from "@/app/api/projects/[projectId]/approvals/[approvalId]/approve/route";
import { POST as rejectProposal } from "@/app/api/projects/[projectId]/approvals/[approvalId]/reject/route";

function createRequest(url, method = "GET", body = null, token = null, internalSecret = null) {
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (internalSecret) {
    headers.set("x-internal-secret", internalSecret);
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

describe("Phases 28 to 30: Human-in-the-Loop Integration & Internal Security", () => {
  let testOrg, testProject;
  let pmUser, devUser, viewerUser;
  let pmToken, devToken, viewerToken;
  const internalSecretKey = process.env.AI_INTERNAL_SECRET_KEY || "internal_agent_secret_key_change_me";

  const testSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  beforeAll(async () => {
    // 1. Create Organization
    testOrg = await prisma.organization.create({
      data: {
        name: `Org Phases 28-30 ${testSuffix}`,
        slug: `org-28-30-${testSuffix}`,
      },
    });

    // 2. Create Users
    pmUser = await prisma.user.create({
      data: { name: "PM Lead", email: `pm_28_30_${testSuffix}@enterprise.io` },
    });
    devUser = await prisma.user.create({
      data: { name: "Dev Engineer", email: `dev_28_30_${testSuffix}@enterprise.io` },
    });
    viewerUser = await prisma.user.create({
      data: { name: "Viewer Stakeholder", email: `viewer_28_30_${testSuffix}@enterprise.io` },
    });

    // 3. Create Sessions
    const pmSession = await prisma.session.create({
      data: {
        userId: pmUser.id,
        token: `session_pm_${testSuffix}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    pmToken = pmSession.token;

    const devSession = await prisma.session.create({
      data: {
        userId: devUser.id,
        token: `session_dev_${testSuffix}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    devToken = devSession.token;

    const viewerSession = await prisma.session.create({
      data: {
        userId: viewerUser.id,
        token: `session_viewer_${testSuffix}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    viewerToken = viewerSession.token;

    // 4. Create Project
    testProject = await prisma.project.create({
      data: {
        organizationId: testOrg.id,
        name: `Autonomous Platform ${testSuffix}`,
        key: `P${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        description: "Phase 28-30 human-in-the-loop and security verification",
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
    try {
      if (testProject) {
        await prisma.approval.deleteMany({ where: { projectId: testProject.id } });
        await prisma.dependency.deleteMany({ where: { projectId: testProject.id } });
        await prisma.task.deleteMany({ where: { projectId: testProject.id } });
        await prisma.userStory.deleteMany({
          where: { feature: { epic: { projectId: testProject.id } } },
        });
        await prisma.feature.deleteMany({ where: { epic: { projectId: testProject.id } } });
        await prisma.epic.deleteMany({ where: { projectId: testProject.id } });
        await prisma.sprint.deleteMany({ where: { projectId: testProject.id } });
        await prisma.risk.deleteMany({ where: { projectId: testProject.id } });
        await prisma.activityLog.deleteMany({ where: { projectId: testProject.id } });
        await prisma.projectMember.deleteMany({ where: { projectId: testProject.id } });
        await prisma.project.delete({ where: { id: testProject.id } });
      }

      if (testOrg) {
        await prisma.organization.delete({ where: { id: testOrg.id } });
      }

      const userIds = [pmUser?.id, devUser?.id, viewerUser?.id].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } catch (err) {
      console.warn("Cleanup warning:", err.message);
    }
  });

  // =========================================================================
  // Phase 29: Next.js ↔ FastAPI Internal Secure Communication Tests
  // =========================================================================
  describe("Phase 29: Next.js ↔ FastAPI Internal Secure Communication", () => {
    it("validateInternalServiceRequest accepts valid x-internal-secret header", () => {
      const req = createRequest("http://localhost:3000/api/internal", "GET", null, null, internalSecretKey);
      expect(() => validateInternalServiceRequest(req)).not.toThrow();
    });

    it("validateInternalServiceRequest rejects invalid x-internal-secret header with AuthenticationError", () => {
      const req = createRequest("http://localhost:3000/api/internal", "GET", null, null, "wrong_secret_key");
      expect(() => validateInternalServiceRequest(req)).toThrow("Invalid or missing internal service secret header.");
    });

    it("validateInternalServiceRequest rejects missing x-internal-secret header", () => {
      const req = createRequest("http://localhost:3000/api/internal", "GET", null, null, null);
      expect(() => validateInternalServiceRequest(req)).toThrow("Invalid or missing internal service secret header.");
    });

    it("requireAuth authenticates request presenting valid internal secret", async () => {
      const req = createRequest("http://localhost:3000/api/test", "GET", null, null, internalSecretKey);
      const authResult = await requireAuth(req);
      expect(authResult.isInternal).toBe(true);
      expect(authResult.user.role).toBe("AGENT");
    });

    it("requireAuth rejects request lacking both session token and internal secret", async () => {
      const req = createRequest("http://localhost:3000/api/test", "GET");
      await expect(requireAuth(req)).rejects.toThrow("Authentication required. Please sign in.");
    });
  });

  // =========================================================================
  // Phase 28: Human-in-the-Loop Proposal Submission (FastAPI -> Next.js)
  // =========================================================================
  describe("Phase 28: Human-in-the-Loop AI Proposal Submission", () => {
    let taskApprovalId, sprintApprovalId, riskApprovalId, depApprovalId, breakdownApprovalId;
    let createdTaskId1, createdTaskId2;

    it("creates a CREATE_TASK approval proposal via internal AI service request", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        {
          actionType: "CREATE_TASK",
          payload: {
            title: "Implement Raft Consensus Snapshot Writer",
            description: "High-impact storage writer task proposed by Task Decomposer Agent",
            priority: "CRITICAL",
            storyPoints: 8,
          },
        },
        null,
        internalSecretKey
      );

      const res = await createApproval(req, { params: { projectId: testProject.id } });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe("PENDING");
      expect(data.data.actionType).toBe("CREATE_TASK");
      expect(data.data.requestedById).toBeNull();
      taskApprovalId = data.data.id;
    });

    it("creates a CREATE_SPRINT approval proposal via internal AI service request", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        {
          actionType: "CREATE_SPRINT",
          payload: {
            name: "Sprint 1 - Core Raft Engine",
            goal: "Deliver consensus protocol and snapshot replication",
            capacity: 34,
          },
        },
        null,
        internalSecretKey
      );

      const res = await createApproval(req, { params: { projectId: testProject.id } });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe("PENDING");
      expect(data.data.actionType).toBe("CREATE_SPRINT");
      sprintApprovalId = data.data.id;
    });

    it("creates a CREATE_RISK approval proposal via internal AI service request", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        {
          actionType: "CREATE_RISK",
          payload: {
            title: "Disk I/O lock contention on WAL snapshotting",
            severity: "HIGH",
            probability: 4,
            impact: 4,
            mitigation: "Implement asynchronous background writer with double buffering",
          },
        },
        null,
        internalSecretKey
      );

      const res = await createApproval(req, { params: { projectId: testProject.id } });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe("PENDING");
      expect(data.data.actionType).toBe("CREATE_RISK");
      riskApprovalId = data.data.id;
    });

    it("rejects approval submission with invalid internal secret", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        {
          actionType: "CREATE_TASK",
          payload: { title: "Unauthorized AI Task" },
        },
        null,
        "invalid_secret_token"
      );

      const res = await createApproval(req, { params: { projectId: testProject.id } });
      expect(res.status).toBe(401);
    });

    // =========================================================================
    // Phase 28: Human Lead Approval Execution (Next.js -> Neon PostgreSQL)
    // =========================================================================
    it("executes CREATE_TASK mutation in transaction when PM approves", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${taskApprovalId}/approve`,
        "POST",
        null,
        pmToken
      );

      const res = await approveProposal(req, {
        params: { projectId: testProject.id, approvalId: taskApprovalId },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.approved).toBe(true);
      expect(data.data.approval.status).toBe("APPROVED");
      expect(data.data.executionResult.title).toBe("Implement Raft Consensus Snapshot Writer");
      createdTaskId1 = data.data.executionResult.id;

      // Verify task exists in Neon PostgreSQL
      const dbTask = await prisma.task.findUnique({ where: { id: createdTaskId1 } });
      expect(dbTask).not.toBeNull();
      expect(dbTask.priority).toBe("URGENT");
      expect(dbTask.storyPoints).toBe(8);
    });

    it("executes CREATE_SPRINT mutation in transaction when PM approves", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${sprintApprovalId}/approve`,
        "POST",
        null,
        pmToken
      );

      const res = await approveProposal(req, {
        params: { projectId: testProject.id, approvalId: sprintApprovalId },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.approval.status).toBe("APPROVED");
      expect(data.data.executionResult.name).toBe("Sprint 1 - Core Raft Engine");

      // Verify sprint exists in Neon PostgreSQL
      const dbSprint = await prisma.sprint.findUnique({
        where: { id: data.data.executionResult.id },
      });
      expect(dbSprint).not.toBeNull();
      expect(dbSprint.capacity).toBe(34);
    });

    it("executes CREATE_RISK mutation in transaction when PM approves", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${riskApprovalId}/approve`,
        "POST",
        null,
        pmToken
      );

      const res = await approveProposal(req, {
        params: { projectId: testProject.id, approvalId: riskApprovalId },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.approval.status).toBe("APPROVED");

      // Verify risk exists in Neon PostgreSQL
      const dbRisk = await prisma.risk.findUnique({
        where: { id: data.data.executionResult.id },
      });
      expect(dbRisk).not.toBeNull();
      expect(dbRisk.title).toBe("Disk I/O lock contention on WAL snapshotting");
      expect(dbRisk.severity).toBe("HIGH");
    });

    it("executes CREATE_TASK_DEPENDENCY mutation when PM approves", async () => {
      // 1. Create a second task directly to test dependency
      const task2 = await prisma.task.create({
        data: {
          projectId: testProject.id,
          title: "Expose gRPC Raft Compaction Service",
          priority: "HIGH",
          storyPoints: 5,
        },
      });
      createdTaskId2 = task2.id;

      // 2. Submit dependency approval proposal
      const submitReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        {
          actionType: "CREATE_TASK_DEPENDENCY",
          payload: {
            fromTaskId: createdTaskId1,
            toTaskId: createdTaskId2,
            type: "BLOCKS",
          },
        },
        null,
        internalSecretKey
      );
      const submitRes = await createApproval(submitReq, { params: { projectId: testProject.id } });
      const submitData = await submitRes.json();
      depApprovalId = submitData.data.id;

      // 3. PM Approves dependency
      const approveReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${depApprovalId}/approve`,
        "POST",
        null,
        pmToken
      );
      const approveRes = await approveProposal(approveReq, {
        params: { projectId: testProject.id, approvalId: depApprovalId },
      });
      expect(approveRes.status).toBe(200);

      // 4. Verify dependency exists in database
      const dbDep = await prisma.dependency.findFirst({
        where: {
          sourceTaskId: createdTaskId1,
          targetTaskId: createdTaskId2,
        },
      });
      expect(dbDep).not.toBeNull();
      expect(dbDep.type).toBe("BLOCKS");
    });

    it("executes INITIALIZE_PROJECT_BREAKDOWN atomically creating Epics, Features, Stories, and Tasks", async () => {
      // 1. Submit work breakdown approval proposal
      const submitReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        {
          actionType: "INITIALIZE_PROJECT_BREAKDOWN",
          payload: {
            epics: [
              {
                title: "Distributed Storage Engine",
                description: "Complete replication and compaction architecture",
                features: [
                  {
                    title: "WAL Compaction",
                    description: "Compacting append-only logs",
                    stories: [
                      {
                        title: "Snapshot Log Writer",
                        user_role: "SRE Engineer",
                        action: "compact logs automatically",
                        benefit: "disk storage remains optimal",
                        story_points: 13,
                        tasks: [
                          {
                            title: "Snapshot Writer Daemon",
                            description: "Background worker thread",
                            priority: "HIGH",
                            points: 8,
                          },
                          {
                            title: "Heartbeat Pause Gate",
                            description: "Prevents split-brain during compaction",
                            priority: "CRITICAL",
                            points: 5,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
        null,
        internalSecretKey
      );

      const submitRes = await createApproval(submitReq, { params: { projectId: testProject.id } });
      const submitData = await submitRes.json();
      breakdownApprovalId = submitData.data.id;

      // 2. PM Approves work breakdown
      const approveReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${breakdownApprovalId}/approve`,
        "POST",
        null,
        pmToken
      );
      const approveRes = await approveProposal(approveReq, {
        params: { projectId: testProject.id, approvalId: breakdownApprovalId },
      });
      expect(approveRes.status).toBe(200);

      // 3. Verify epic, feature, story, and tasks are in database
      const dbEpic = await prisma.epic.findFirst({
        where: { projectId: testProject.id, title: "Distributed Storage Engine" },
        include: {
          features: {
            include: {
              userStories: {
                include: {
                  tasks: true,
                },
              },
            },
          },
        },
      });

      expect(dbEpic).not.toBeNull();
      expect(dbEpic.features.length).toBe(1);
      expect(dbEpic.features[0].userStories.length).toBe(1);
      expect(dbEpic.features[0].userStories[0].tasks.length).toBe(2);
    });

    it("rejects an approval proposal with reason when lead rejects", async () => {
      // 1. Submit proposal
      const submitReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        {
          actionType: "CREATE_TASK",
          payload: { title: "Deprecated Monolith Module" },
        },
        null,
        internalSecretKey
      );
      const submitRes = await createApproval(submitReq, { params: { projectId: testProject.id } });
      const submitData = await submitRes.json();
      const rejectApprovalId = submitData.data.id;

      // 2. PM rejects
      const rejectReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${rejectApprovalId}/reject`,
        "POST",
        { reason: "Monolith module is superseded by distributed engine architecture." },
        pmToken
      );
      const rejectRes = await rejectProposal(rejectReq, {
        params: { projectId: testProject.id, approvalId: rejectApprovalId },
      });
      expect(rejectRes.status).toBe(200);
      const rejectData = await rejectRes.json();
      expect(rejectData.success).toBe(true);
      expect(rejectData.data.rejected).toBe(true);
      expect(rejectData.data.approval.status).toBe("REJECTED");
      expect(rejectData.data.approval.rejectionReason).toContain("superseded");
    });

    it("prevents VIEWER role from approving a mutation proposal", async () => {
      // Submit proposal
      const submitReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals`,
        "POST",
        {
          actionType: "CREATE_TASK",
          payload: { title: "Unauthorized Test Task" },
        },
        null,
        internalSecretKey
      );
      const submitRes = await createApproval(submitReq, { params: { projectId: testProject.id } });
      const submitData = await submitRes.json();
      const testApprovalId = submitData.data.id;

      // VIEWER tries to approve
      const approveReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${testApprovalId}/approve`,
        "POST",
        null,
        viewerToken
      );
      const approveRes = await approveProposal(approveReq, {
        params: { projectId: testProject.id, approvalId: testApprovalId },
      });
      expect(approveRes.status).toBe(403);
    });

    it("prevents re-approving an already approved proposal (409 Conflict)", async () => {
      const approveReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/approvals/${taskApprovalId}/approve`,
        "POST",
        null,
        pmToken
      );
      const approveRes = await approveProposal(approveReq, {
        params: { projectId: testProject.id, approvalId: taskApprovalId },
      });
      expect(approveRes.status).toBe(409);
    });
  });
});
