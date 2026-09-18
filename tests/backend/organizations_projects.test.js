import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";

// Organization Route Handlers
import { GET as listOrgs, POST as createOrg } from "@/app/api/organizations/route";
import { GET as getOrg, PATCH as updateOrg } from "@/app/api/organizations/[organizationId]/route";
import { GET as getOrgMembers, POST as addOrgMember } from "@/app/api/organizations/[organizationId]/members/route";
import { DELETE as removeOrgMember } from "@/app/api/organizations/[organizationId]/members/[userId]/route";
import { GET as getOrgProjects, POST as createOrgProject } from "@/app/api/organizations/[organizationId]/projects/route";

// Project Route Handlers
import { GET as listProjects, POST as createProject } from "@/app/api/projects/route";
import { GET as getProject, PATCH as updateProject, DELETE as deleteProject } from "@/app/api/projects/[projectId]/route";
import { GET as getProjMembers, POST as addProjMember } from "@/app/api/projects/[projectId]/members/route";
import { DELETE as removeProjMember } from "@/app/api/projects/[projectId]/members/[userId]/route";

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

describe("Phase 7 & 8: Organization & Project API Route Handlers", () => {
  let ownerUser, devUser, viewerUser, externalUser;
  let ownerToken, devToken, viewerToken, externalToken;
  let createdOrgId, createdProjectId;

  const testSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  beforeAll(async () => {
    // 1. Create test users
    ownerUser = await prisma.user.create({
      data: { name: "Org Owner", email: `owner_${testSuffix}@enterprise.io` },
    });
    devUser = await prisma.user.create({
      data: { name: "Org Dev", email: `dev_${testSuffix}@enterprise.io` },
    });
    viewerUser = await prisma.user.create({
      data: { name: "Org Viewer", email: `viewer_${testSuffix}@enterprise.io` },
    });
    externalUser = await prisma.user.create({
      data: { name: "External User", email: `external_${testSuffix}@enterprise.io` },
    });

    // 2. Create session tokens
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    ownerToken = `tok_owner_${testSuffix}`;
    devToken = `tok_dev_${testSuffix}`;
    viewerToken = `tok_viewer_${testSuffix}`;
    externalToken = `tok_ext_${testSuffix}`;

    await prisma.session.createMany({
      data: [
        { userId: ownerUser.id, token: ownerToken, expiresAt: tomorrow },
        { userId: devUser.id, token: devToken, expiresAt: tomorrow },
        { userId: viewerUser.id, token: viewerToken, expiresAt: tomorrow },
        { userId: externalUser.id, token: externalToken, expiresAt: tomorrow },
      ],
    });
  });

  afterAll(async () => {
    // Clean up created resources in database
    if (createdProjectId) {
      await prisma.activityLog.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.projectMember.deleteMany({ where: { projectId: createdProjectId } });
      await prisma.project.deleteMany({ where: { id: createdProjectId } });
    }

    if (createdOrgId) {
      // Find any remaining projects under this org
      const projects = await prisma.project.findMany({
        where: { organizationId: createdOrgId },
        select: { id: true },
      });
      const pIds = projects.map((p) => p.id);
      if (pIds.length > 0) {
        await prisma.activityLog.deleteMany({ where: { projectId: { in: pIds } } });
        await prisma.projectMember.deleteMany({ where: { projectId: { in: pIds } } });
        await prisma.project.deleteMany({ where: { id: { in: pIds } } });
      }

      await prisma.organizationMember.deleteMany({ where: { organizationId: createdOrgId } });
      await prisma.organization.deleteMany({ where: { id: createdOrgId } });
    }

    const userIds = [ownerUser.id, devUser.id, viewerUser.id, externalUser.id];
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    await prisma.$disconnect();
  });

  // ===========================================================================
  // PHASE 7: ORGANIZATION APIS
  // ===========================================================================
  describe("Phase 7: Organization APIs", () => {
    it("POST /api/organizations — creates an organization and assigns creator as OWNER", async () => {
      const payload = {
        name: `Acme Corp ${testSuffix}`,
        slug: `acme-${testSuffix}`,
      };
      const req = createRequest("http://localhost:3000/api/organizations", "POST", payload, ownerToken);
      const res = await createOrg(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.name).toBe(payload.name);
      expect(json.data.slug).toBe(payload.slug);

      createdOrgId = json.data.id;

      // Verify creator was assigned as OWNER in DB
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: createdOrgId,
            userId: ownerUser.id,
          },
        },
      });
      expect(member).toBeDefined();
      expect(member.role).toBe("OWNER");
    });

    it("POST /api/organizations — validates payload and returns 422 for invalid input", async () => {
      const invalidPayload = { name: "A" }; // Min length is 2
      const req = createRequest("http://localhost:3000/api/organizations", "POST", invalidPayload, ownerToken);
      const res = await createOrg(req);
      const json = await res.json();

      expect(res.status).toBe(422);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("GET /api/organizations — lists organizations the authenticated user belongs to", async () => {
      const req = createRequest("http://localhost:3000/api/organizations", "GET", null, ownerToken);
      const res = await listOrgs(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      const found = json.data.find((o) => o.id === createdOrgId);
      expect(found).toBeDefined();
      expect(found.role).toBe("OWNER");
      expect(found.memberCount).toBeGreaterThanOrEqual(1);
    });

    it("GET /api/organizations/[organizationId] — retrieves organization details", async () => {
      const req = createRequest(`http://localhost:3000/api/organizations/${createdOrgId}`, "GET", null, ownerToken);
      const res = await getOrg(req, { params: { organizationId: createdOrgId } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(createdOrgId);
      expect(json.data.members).toBeDefined();
      expect(json.data.members.length).toBeGreaterThanOrEqual(1);
    });

    it("GET /api/organizations/[organizationId] — rejects external user with 403", async () => {
      const req = createRequest(`http://localhost:3000/api/organizations/${createdOrgId}`, "GET", null, externalToken);
      const res = await getOrg(req, { params: { organizationId: createdOrgId } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
    });

    it("PATCH /api/organizations/[organizationId] — updates organization details for OWNER", async () => {
      const updatePayload = { name: `Acme Global ${testSuffix}` };
      const req = createRequest(`http://localhost:3000/api/organizations/${createdOrgId}`, "PATCH", updatePayload, ownerToken);
      const res = await updateOrg(req, { params: { organizationId: createdOrgId } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.name).toBe(updatePayload.name);
    });

    it("POST /api/organizations/[organizationId]/members — adds a member with specific role", async () => {
      const payload = { userId: devUser.id, role: "MEMBER" };
      const req = createRequest(`http://localhost:3000/api/organizations/${createdOrgId}/members`, "POST", payload, ownerToken);
      const res = await addOrgMember(req, { params: { organizationId: createdOrgId } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.userId).toBe(devUser.id);
      expect(json.data.role).toBe("MEMBER");

      // Also add viewerUser with VIEWER role
      const viewerPayload = { email: viewerUser.email, role: "VIEWER" };
      const viewerReq = createRequest(`http://localhost:3000/api/organizations/${createdOrgId}/members`, "POST", viewerPayload, ownerToken);
      const viewerRes = await addOrgMember(viewerReq, { params: { organizationId: createdOrgId } });
      expect(viewerRes.status).toBe(201);
    });

    it("POST /api/organizations/[organizationId]/members — rejects duplicate member with 409", async () => {
      const payload = { userId: devUser.id, role: "MEMBER" };
      const req = createRequest(`http://localhost:3000/api/organizations/${createdOrgId}/members`, "POST", payload, ownerToken);
      const res = await addOrgMember(req, { params: { organizationId: createdOrgId } });
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.success).toBe(false);
    });

    it("DELETE /api/organizations/[organizationId]/members/[userId] — prevents removing sole OWNER", async () => {
      const req = createRequest(`http://localhost:3000/api/organizations/${createdOrgId}/members/${ownerUser.id}`, "DELETE", null, ownerToken);
      const res = await removeOrgMember(req, { params: { organizationId: createdOrgId, userId: ownerUser.id } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
    });
  });

  // ===========================================================================
  // PHASE 8: PROJECT APIS
  // ===========================================================================
  describe("Phase 8: Project APIs", () => {
    const projectKey = `P${Date.now().toString().slice(-6)}`;

    it("POST /api/projects — creates a new project and auto-assigns creator as PROJECT_MANAGER", async () => {
      const payload = {
        organizationId: createdOrgId,
        name: `Alpha Project ${testSuffix}`,
        key: projectKey,
        description: "Initial AI engineering project",
        status: "PLANNING",
        startDate: "2026-10-01",
        targetDate: "2026-12-31",
      };

      const req = createRequest("http://localhost:3000/api/projects", "POST", payload, ownerToken);
      const res = await createProject(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.key).toBe(projectKey);

      createdProjectId = json.data.id;

      // Verify activity log was written to database
      const activity = await prisma.activityLog.findFirst({
        where: {
          projectId: createdProjectId,
          action: "PROJECT_CREATED",
        },
      });
      expect(activity).toBeDefined();
      expect(activity.entityType).toBe("PROJECT");
      expect(activity.userId).toBe(ownerUser.id);

      // Verify ProjectMember record created
      const pmRecord = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: createdProjectId,
            userId: ownerUser.id,
          },
        },
      });
      expect(pmRecord).toBeDefined();
      expect(pmRecord.role).toBe("PROJECT_MANAGER");
    });

    it("POST /api/projects — rejects creation with duplicate key with 409", async () => {
      const duplicatePayload = {
        organizationId: createdOrgId,
        name: "Duplicate Key Project",
        key: projectKey, // Same key
      };

      const req = createRequest("http://localhost:3000/api/projects", "POST", duplicatePayload, ownerToken);
      const res = await createProject(req);
      const json = await res.json();

      expect(res.status).toBe(409);
      expect(json.success).toBe(false);
    });

    it("POST /api/projects — rejects creation when user is only a VIEWER in organization", async () => {
      const payload = {
        organizationId: createdOrgId,
        name: "Unauthorized Project",
        key: `U${Date.now().toString().slice(-6)}`,
      };

      const req = createRequest("http://localhost:3000/api/projects", "POST", payload, viewerToken);
      const res = await createProject(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
    });

    it("GET /api/projects — lists projects accessible to the user", async () => {
      const req = createRequest("http://localhost:3000/api/projects", "GET", null, ownerToken);
      const res = await listProjects(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      const found = json.data.find((p) => p.id === createdProjectId);
      expect(found).toBeDefined();
      expect(found.key).toBe(projectKey);
      expect(found.counts).toBeDefined();
    });

    it("GET /api/projects/[projectId] — retrieves single project details and metadata", async () => {
      const req = createRequest(`http://localhost:3000/api/projects/${createdProjectId}`, "GET", null, ownerToken);
      const res = await getProject(req, { params: { projectId: createdProjectId } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(createdProjectId);
      expect(json.data.members).toBeDefined();
      expect(json.data._count).toBeDefined();
    });

    it("PATCH /api/projects/[projectId] — updates project fields and records audit log", async () => {
      const updatePayload = {
        name: `Alpha Project Updated ${testSuffix}`,
        status: "ACTIVE",
        description: "Updated description for active development",
      };

      const req = createRequest(`http://localhost:3000/api/projects/${createdProjectId}`, "PATCH", updatePayload, ownerToken);
      const res = await updateProject(req, { params: { projectId: createdProjectId } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.name).toBe(updatePayload.name);
      expect(json.data.status).toBe("ACTIVE");

      // Verify activity log recorded
      const activity = await prisma.activityLog.findFirst({
        where: {
          projectId: createdProjectId,
          action: "PROJECT_UPDATED",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(activity).toBeDefined();
      expect(activity.entityType).toBe("PROJECT");
    });

    it("GET /api/projects/[projectId]/members — lists members assigned to project", async () => {
      const req = createRequest(`http://localhost:3000/api/projects/${createdProjectId}/members`, "GET", null, ownerToken);
      const res = await getProjMembers(req, { params: { projectId: createdProjectId } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
      expect(json.data[0].role).toBe("PROJECT_MANAGER");
    });

    it("POST /api/projects/[projectId]/members — assigns user a specific ProjectRole", async () => {
      const payload = {
        userId: devUser.id,
        role: "DEVELOPER",
      };

      const req = createRequest(`http://localhost:3000/api/projects/${createdProjectId}/members`, "POST", payload, ownerToken);
      const res = await addProjMember(req, { params: { projectId: createdProjectId } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.userId).toBe(devUser.id);
      expect(json.data.role).toBe("DEVELOPER");

      // Verify activity log was recorded
      const activity = await prisma.activityLog.findFirst({
        where: {
          projectId: createdProjectId,
          action: "PROJECT_MEMBER_ADDED",
        },
        orderBy: { createdAt: "desc" },
      });
      expect(activity).toBeDefined();
    });

    it("POST /api/projects/[projectId]/members — assigns user by email as TESTER", async () => {
      const payload = {
        email: viewerUser.email,
        role: "TESTER",
      };

      const req = createRequest(`http://localhost:3000/api/projects/${createdProjectId}/members`, "POST", payload, ownerToken);
      const res = await addProjMember(req, { params: { projectId: createdProjectId } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.userId).toBe(viewerUser.id);
      expect(json.data.role).toBe("TESTER");
    });

    it("DELETE /api/projects/[projectId]/members/[userId] — removes member from project", async () => {
      const req = createRequest(
        `http://localhost:3000/api/projects/${createdProjectId}/members/${devUser.id}`,
        "DELETE",
        null,
        ownerToken
      );
      const res = await removeProjMember(req, {
        params: { projectId: createdProjectId, userId: devUser.id },
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.removed).toBe(true);

      // Verify member is removed from database
      const deletedMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: createdProjectId,
            userId: devUser.id,
          },
        },
      });
      expect(deletedMember).toBeNull();
    });

    it("GET /api/organizations/[organizationId]/projects — returns organization projects", async () => {
      const req = createRequest(`http://localhost:3000/api/organizations/${createdOrgId}/projects`, "GET", null, ownerToken);
      const res = await getOrgProjects(req, { params: { organizationId: createdOrgId } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.some((p) => p.id === createdProjectId)).toBe(true);
    });

    it("POST /api/organizations/[organizationId]/projects — creates project scoped to organization", async () => {
      const scopedKey = `SC${Date.now().toString().slice(-6)}`;
      const payload = {
        name: `Scoped Project ${testSuffix}`,
        key: scopedKey,
      };

      const req = createRequest(`http://localhost:3000/api/organizations/${createdOrgId}/projects`, "POST", payload, ownerToken);
      const res = await createOrgProject(req, { params: { organizationId: createdOrgId } });
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.key).toBe(scopedKey);
      expect(json.data.organizationId).toBe(createdOrgId);

      // Clean up scoped project immediately
      await prisma.activityLog.deleteMany({ where: { projectId: json.data.id } });
      await prisma.projectMember.deleteMany({ where: { projectId: json.data.id } });
      await prisma.project.delete({ where: { id: json.data.id } });
    });

    it("DELETE /api/projects/[projectId] — deletes project and records audit log", async () => {
      const req = createRequest(`http://localhost:3000/api/projects/${createdProjectId}`, "DELETE", null, ownerToken);
      const res = await deleteProject(req, { params: { projectId: createdProjectId } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.deleted).toBe(true);

      // Verify deletion in database
      const dbProject = await prisma.project.findUnique({
        where: { id: createdProjectId },
      });
      expect(dbProject).toBeNull();

      // Reset createdProjectId so afterAll does not try to clean it again
      createdProjectId = null;
    });
  });
});
