import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";

// Requirement Route Handlers
import { GET as listRequirements, POST as createRequirement } from "@/app/api/projects/[projectId]/requirements/route";
import {
  GET as getRequirement,
  PATCH as updateRequirement,
  DELETE as deleteRequirement,
} from "@/app/api/projects/[projectId]/requirements/[requirementId]/route";

// Epic Route Handlers
import { GET as listEpics, POST as createEpic } from "@/app/api/projects/[projectId]/epics/route";
import {
  GET as getEpic,
  PATCH as updateEpic,
  DELETE as deleteEpic,
} from "@/app/api/projects/[projectId]/epics/[epicId]/route";

// Feature Route Handlers
import { GET as listEpicFeatures, POST as createEpicFeature } from "@/app/api/projects/[projectId]/epics/[epicId]/features/route";
import {
  GET as getFeature,
  PATCH as updateFeature,
  DELETE as deleteFeature,
} from "@/app/api/projects/[projectId]/features/[featureId]/route";
import { GET as listProjectFeatures } from "@/app/api/projects/[projectId]/features/route";

// Story Route Handlers
import { GET as listStories, POST as createStory } from "@/app/api/projects/[projectId]/stories/route";
import {
  GET as getStory,
  PATCH as updateStory,
  DELETE as deleteStory,
} from "@/app/api/projects/[projectId]/stories/[storyId]/route";
import {
  GET as listFeatureStories,
  POST as createFeatureStory,
} from "@/app/api/projects/[projectId]/features/[featureId]/stories/route";

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

describe("Phase 9 & 10: Requirements, Epics, Features, and User Stories", () => {
  let testOrg, testProject;
  let pmUser, devUser, viewerUser, externalUser;
  let pmToken, devToken, viewerToken, externalToken;

  let createdRequirementId;
  let createdEpicId;
  let createdFeatureId;
  let createdStoryId;

  const testSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  beforeAll(async () => {
    // 1. Create Organization
    testOrg = await prisma.organization.create({
      data: {
        name: `Org Work Breakdown ${testSuffix}`,
        slug: `wb-org-${testSuffix}`,
      },
    });

    // 2. Create Users
    pmUser = await prisma.user.create({
      data: { name: "PM User", email: `pm_${testSuffix}@enterprise.io` },
    });
    devUser = await prisma.user.create({
      data: { name: "Dev User", email: `dev_${testSuffix}@enterprise.io` },
    });
    viewerUser = await prisma.user.create({
      data: { name: "Viewer User", email: `viewer_${testSuffix}@enterprise.io` },
    });
    externalUser = await prisma.user.create({
      data: { name: "External User", email: `ext_${testSuffix}@enterprise.io` },
    });

    // 3. Create Sessions
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    pmToken = `tok_pm_${testSuffix}`;
    devToken = `tok_dev_${testSuffix}`;
    viewerToken = `tok_viewer_${testSuffix}`;
    externalToken = `tok_ext_${testSuffix}`;

    await prisma.session.createMany({
      data: [
        { userId: pmUser.id, token: pmToken, expiresAt: tomorrow },
        { userId: devUser.id, token: devToken, expiresAt: tomorrow },
        { userId: viewerUser.id, token: viewerToken, expiresAt: tomorrow },
        { userId: externalUser.id, token: externalToken, expiresAt: tomorrow },
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
        name: `WB Project ${testSuffix}`,
        key: `WB${Date.now().toString().slice(-6)}`,
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
    // Clean up created resources
    if (testProject) {
      await prisma.activityLog.deleteMany({ where: { projectId: testProject.id } });
      await prisma.task.deleteMany({ where: { projectId: testProject.id } });
      await prisma.userStory.deleteMany({
        where: { feature: { epic: { projectId: testProject.id } } },
      });
      await prisma.feature.deleteMany({
        where: { epic: { projectId: testProject.id } },
      });
      await prisma.epic.deleteMany({ where: { projectId: testProject.id } });
      await prisma.requirement.deleteMany({ where: { projectId: testProject.id } });
      await prisma.projectMember.deleteMany({ where: { projectId: testProject.id } });
      await prisma.project.delete({ where: { id: testProject.id } });
    }

    if (testOrg) {
      await prisma.organizationMember.deleteMany({ where: { organizationId: testOrg.id } });
      await prisma.organization.delete({ where: { id: testOrg.id } });
    }

    const userIds = [pmUser.id, devUser.id, viewerUser.id, externalUser.id];
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    await prisma.$disconnect();
  });

  // ===========================================================================
  // PHASE 9: REQUIREMENTS APIS
  // ===========================================================================
  describe("Phase 9: Requirements APIs", () => {
    it("POST /api/projects/[projectId]/requirements — creates a requirement and logs activity", async () => {
      const payload = {
        title: "Autonomous Agent Task Decomposition Specification",
        description: "PRD defining autonomous sub-task graph generation from user stories.",
        type: "FUNCTIONAL",
        priority: "HIGH",
        status: "DRAFT",
        acceptanceCriteria: [
          "Graph decomposition completes in under 5 seconds",
          "Dependencies are acyclic (DAG)",
        ],
        businessGoal: "Accelerate engineering planning velocity by 50%",
        constraints: { maxSubtasks: 20 },
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/requirements`,
        "POST",
        payload,
        pmToken
      );
      const res = await createRequirement(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.title).toBe(payload.title);
      expect(json.data.version).toBe(1);

      createdRequirementId = json.data.id;

      // Verify activity log recorded
      const activity = await prisma.activityLog.findFirst({
        where: {
          projectId: testProject.id,
          entityId: createdRequirementId,
          action: "REQUIREMENT_CREATED",
        },
      });
      expect(activity).toBeDefined();
      expect(activity.entityType).toBe("REQUIREMENT");
    });

    it("POST /api/projects/[projectId]/requirements — returns 422 on invalid payload", async () => {
      const invalidPayload = { title: "X" }; // Min 2 characters
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/requirements`,
        "POST",
        invalidPayload,
        pmToken
      );
      const res = await createRequirement(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("POST /api/projects/[projectId]/requirements — rejects VIEWER role with 403", async () => {
      const payload = { title: "Unauthorized Requirement Spec" };
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/requirements`,
        "POST",
        payload,
        viewerToken
      );
      const res = await createRequirement(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
    });

    it("GET /api/projects/[projectId]/requirements — lists requirements with filtering", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/requirements?type=FUNCTIONAL&status=DRAFT`,
        "GET",
        null,
        devToken
      );
      const res = await listRequirements(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      const found = json.data.find((r) => r.id === createdRequirementId);
      expect(found).toBeDefined();
    });

    it("GET /api/projects/[projectId]/requirements/[requirementId] — retrieves requirement details", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/requirements/${createdRequirementId}`,
        "GET",
        null,
        viewerToken
      );
      const res = await getRequirement(req, {
        params: { projectId: testProject.id, requirementId: createdRequirementId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(createdRequirementId);
    });

    it("PATCH /api/projects/[projectId]/requirements/[requirementId] — updates content and increments version", async () => {
      const updatePayload = {
        title: "Autonomous Agent Task Decomposition Specification v2",
        status: "APPROVED",
        businessGoal: "Accelerate engineering planning velocity by 75%",
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/requirements/${createdRequirementId}`,
        "PATCH",
        updatePayload,
        pmToken
      );
      const res = await updateRequirement(req, {
        params: { projectId: testProject.id, requirementId: createdRequirementId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe(updatePayload.title);
      expect(json.data.status).toBe("APPROVED");
      expect(json.data.version).toBe(2); // Auto-incremented version

      // Verify activity log recorded
      const activity = await prisma.activityLog.findFirst({
        where: {
          projectId: testProject.id,
          entityId: createdRequirementId,
          action: "REQUIREMENT_UPDATED",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(activity).toBeDefined();
    });

    it("DELETE /api/projects/[projectId]/requirements/[requirementId] — rejects DEVELOPER and allows PM", async () => {
      // 1. Reject developer
      const devReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/requirements/${createdRequirementId}`,
        "DELETE",
        null,
        devToken
      );
      const devRes = await deleteRequirement(devReq, {
        params: { projectId: testProject.id, requirementId: createdRequirementId },
      });
      expect(devRes.status).toBe(403);

      // 2. Allow PM
      const pmReq = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/requirements/${createdRequirementId}`,
        "DELETE",
        null,
        pmToken
      );
      const pmRes = await deleteRequirement(pmReq, {
        params: { projectId: testProject.id, requirementId: createdRequirementId },
      });
      const json = await pmRes.json();

      expect(pmRes.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deleted).toBe(true);

      const dbCheck = await prisma.requirement.findUnique({ where: { id: createdRequirementId } });
      expect(dbCheck).toBeNull();
    });
  });

  // ===========================================================================
  // PHASE 10: EPIC / FEATURE / STORY APIS
  // ===========================================================================
  describe("Phase 10: Epics, Features, and User Stories", () => {
    // 1. EPICS
    it("POST /api/projects/[projectId]/epics — creates an epic and logs activity", async () => {
      const payload = {
        title: "Multi-Agent Orchestration Engine",
        description: "Core LangGraph multi-agent execution pipeline.",
        status: "PLANNED",
        priority: "HIGH",
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/epics`,
        "POST",
        payload,
        pmToken
      );
      const res = await createEpic(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.title).toBe(payload.title);

      createdEpicId = json.data.id;

      // Verify activity log
      const activity = await prisma.activityLog.findFirst({
        where: {
          projectId: testProject.id,
          entityId: createdEpicId,
          action: "EPIC_CREATED",
        },
      });
      expect(activity).toBeDefined();
    });

    it("GET /api/projects/[projectId]/epics — lists epics with feature counts", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/epics`,
        "GET",
        null,
        devToken
      );
      const res = await listEpics(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      const found = json.data.find((e) => e.id === createdEpicId);
      expect(found).toBeDefined();
      expect(found._count.features).toBeDefined();
    });

    it("PATCH /api/projects/[projectId]/epics/[epicId] — updates epic status", async () => {
      const payload = { status: "IN_PROGRESS" };
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/epics/${createdEpicId}`,
        "PATCH",
        payload,
        devToken
      );
      const res = await updateEpic(req, {
        params: { projectId: testProject.id, epicId: createdEpicId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("IN_PROGRESS");
    });

    // 2. FEATURES
    it("POST /api/projects/[projectId]/epics/[epicId]/features — creates a feature under an epic", async () => {
      const payload = {
        title: "Risk Monitoring Agent Workflow",
        description: "Real-time background risk detection agent.",
        status: "PLANNED",
        priority: "HIGH",
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/epics/${createdEpicId}/features`,
        "POST",
        payload,
        devToken
      );
      const res = await createEpicFeature(req, {
        params: { projectId: testProject.id, epicId: createdEpicId },
      });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.title).toBe(payload.title);

      createdFeatureId = json.data.id;

      // Verify activity log
      const activity = await prisma.activityLog.findFirst({
        where: {
          projectId: testProject.id,
          entityId: createdFeatureId,
          action: "FEATURE_CREATED",
        },
      });
      expect(activity).toBeDefined();
    });

    it("GET /api/projects/[projectId]/features — lists project-scoped features", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/features`,
        "GET",
        null,
        viewerToken
      );
      const res = await listProjectFeatures(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      const found = json.data.find((f) => f.id === createdFeatureId);
      expect(found).toBeDefined();
      expect(found.epic).toBeDefined();
    });

    it("PATCH /api/projects/[projectId]/features/[featureId] — updates feature status", async () => {
      const payload = { status: "IN_PROGRESS" };
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/features/${createdFeatureId}`,
        "PATCH",
        payload,
        devToken
      );
      const res = await updateFeature(req, {
        params: { projectId: testProject.id, featureId: createdFeatureId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("IN_PROGRESS");
    });

    // 3. USER STORIES
    it("POST /api/projects/[projectId]/stories — creates user story linked to feature", async () => {
      const payload = {
        featureId: createdFeatureId,
        title: "Implement Sentinel Risk Analyzer",
        description: "Parse sprint velocity and log high-risk alerts.",
        priority: "HIGH",
        status: "BACKLOG",
        storyPoints: 5,
        assigneeId: devUser.id,
      };

      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/stories`,
        "POST",
        payload,
        devToken
      );
      const res = await createStory(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.title).toBe(payload.title);
      expect(json.data.storyPoints).toBe(5);

      createdStoryId = json.data.id;

      // Verify activity log
      const activity = await prisma.activityLog.findFirst({
        where: {
          projectId: testProject.id,
          entityId: createdStoryId,
          action: "STORY_CREATED",
        },
      });
      expect(activity).toBeDefined();
    });

    it("GET /api/projects/[projectId]/stories — lists user stories with filtering", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/stories?featureId=${createdFeatureId}&status=BACKLOG`,
        "GET",
        null,
        viewerToken
      );
      const res = await listStories(req, { params: { projectId: testProject.id } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      const found = json.data.find((s) => s.id === createdStoryId);
      expect(found).toBeDefined();
      expect(found.assignee.email).toBe(devUser.email);
    });

    it("PATCH /api/projects/[projectId]/stories/[storyId] — status transition from BACKLOG to IN_PROGRESS", async () => {
      const payload = { status: "IN_PROGRESS" };
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/stories/${createdStoryId}`,
        "PATCH",
        payload,
        devToken
      );
      const res = await updateStory(req, {
        params: { projectId: testProject.id, storyId: createdStoryId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("IN_PROGRESS");

      // Verify status change activity log recorded
      const activity = await prisma.activityLog.findFirst({
        where: {
          projectId: testProject.id,
          entityId: createdStoryId,
          action: "STORY_STATUS_CHANGED",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(activity).toBeDefined();
    });

    it("DELETE /api/projects/[projectId]/stories/[storyId] — deletes user story", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/stories/${createdStoryId}`,
        "DELETE",
        null,
        pmToken
      );
      const res = await deleteStory(req, {
        params: { projectId: testProject.id, storyId: createdStoryId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deleted).toBe(true);

      const dbStory = await prisma.userStory.findUnique({ where: { id: createdStoryId } });
      expect(dbStory).toBeNull();
    });

    it("DELETE /api/projects/[projectId]/epics/[epicId] — deletes epic and cascades to features", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${testProject.id}/epics/${createdEpicId}`,
        "DELETE",
        null,
        pmToken
      );
      const res = await deleteEpic(req, {
        params: { projectId: testProject.id, epicId: createdEpicId },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deleted).toBe(true);

      // Verify epic and child feature deleted
      const dbEpic = await prisma.epic.findUnique({ where: { id: createdEpicId } });
      expect(dbEpic).toBeNull();

      const dbFeature = await prisma.feature.findUnique({ where: { id: createdFeatureId } });
      expect(dbFeature).toBeNull();
    });
  });
});
