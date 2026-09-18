import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  requireAuth,
  requireOrganizationMember,
  requireOrganizationRole,
  requireProjectMember,
  requireProjectRole,
  OrganizationRole,
  ProjectRole,
} from "@/lib/utils/permissions";
import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/auth/errors";

describe("Phase 6: Centralized Authorization & Permissions", () => {
  let testOrg;
  let testProject;
  let ownerUser;
  let memberUser;
  let viewerUser;
  let externalUser;

  beforeAll(async () => {
    // 1. Create a dedicated test organization
    testOrg = await prisma.organization.create({
      data: {
        name: "Test Auth Org",
        slug: `test-auth-org-${Date.now()}`,
      },
    });

    // 2. Create users with different roles
    ownerUser = await prisma.user.create({
      data: {
        name: "Test Owner",
        email: `owner_${Date.now()}@test.io`,
      },
    });

    memberUser = await prisma.user.create({
      data: {
        name: "Test Member",
        email: `member_${Date.now()}@test.io`,
      },
    });

    viewerUser = await prisma.user.create({
      data: {
        name: "Test Viewer",
        email: `viewer_${Date.now()}@test.io`,
      },
    });

    externalUser = await prisma.user.create({
      data: {
        name: "External User",
        email: `external_${Date.now()}@test.io`,
      },
    });

    // 3. Assign Organization Roles
    await prisma.organizationMember.createMany({
      data: [
        { organizationId: testOrg.id, userId: ownerUser.id, role: "OWNER" },
        { organizationId: testOrg.id, userId: memberUser.id, role: "MEMBER" },
        { organizationId: testOrg.id, userId: viewerUser.id, role: "VIEWER" },
      ],
    });

    // 4. Create Project
    testProject = await prisma.project.create({
      data: {
        name: "Test Permissions Project",
        key: `TPP_${Date.now().toString().slice(-4)}`,
        organizationId: testOrg.id,
        createdById: ownerUser.id,
      },
    });

    // 5. Assign Project Roles
    await prisma.projectMember.createMany({
      data: [
        { projectId: testProject.id, userId: memberUser.id, role: "DEVELOPER" },
        { projectId: testProject.id, userId: viewerUser.id, role: "VIEWER" },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.projectMember.deleteMany({ where: { projectId: testProject.id } });
    await prisma.project.delete({ where: { id: testProject.id } });
    await prisma.organizationMember.deleteMany({ where: { organizationId: testOrg.id } });
    await prisma.organization.delete({ where: { id: testOrg.id } });

    const userIds = [ownerUser.id, memberUser.id, viewerUser.id, externalUser.id];
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    await prisma.$disconnect();
  });

  describe("1. requireAuth", () => {
    it("throws AuthenticationError if request is unauthenticated", async () => {
      const emptyReq = new Request("http://localhost:3000/api/projects");
      await expect(requireAuth(emptyReq)).rejects.toThrow(AuthenticationError);
    });
  });

  describe("2. requireOrganizationMember", () => {
    it("returns member and organization for valid member", async () => {
      const result = await requireOrganizationMember(memberUser.id, testOrg.id);
      expect(result.member.role).toBe("MEMBER");
      expect(result.organization.id).toBe(testOrg.id);
    });

    it("throws AuthorizationError for user outside the organization", async () => {
      await expect(requireOrganizationMember(externalUser.id, testOrg.id)).rejects.toThrow(
        AuthorizationError
      );
    });

    it("throws NotFoundError for non-existent organization", async () => {
      await expect(requireOrganizationMember(memberUser.id, "non_existent_org_id")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("3. requireOrganizationRole", () => {
    it("permits Organization OWNER to access admin actions automatically", async () => {
      const result = await requireOrganizationRole(ownerUser.id, testOrg.id, [
        OrganizationRole.ADMIN,
      ]);
      expect(result.member.role).toBe("OWNER");
    });

    it("permits member with matching allowed role", async () => {
      const result = await requireOrganizationRole(memberUser.id, testOrg.id, [
        OrganizationRole.MEMBER,
        OrganizationRole.ADMIN,
      ]);
      expect(result.member.role).toBe("MEMBER");
    });

    it("rejects member if role is not in allowed roles", async () => {
      await expect(
        requireOrganizationRole(viewerUser.id, testOrg.id, [
          OrganizationRole.ADMIN,
          OrganizationRole.OWNER,
        ])
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe("4. requireProjectMember", () => {
    it("allows direct project member", async () => {
      const result = await requireProjectMember(memberUser.id, testProject.id);
      expect(result.projectMember.role).toBe("DEVELOPER");
      expect(result.project.id).toBe(testProject.id);
    });

    it("allows Organization OWNER via inherited organization admin access", async () => {
      const result = await requireProjectMember(ownerUser.id, testProject.id);
      expect(result.projectMember).toBeNull();
      expect(result.orgMember.role).toBe("OWNER");
    });

    it("rejects user who is not a project member nor org admin", async () => {
      await expect(requireProjectMember(externalUser.id, testProject.id)).rejects.toThrow(
        AuthorizationError
      );
    });

    it("throws NotFoundError for non-existent project", async () => {
      await expect(requireProjectMember(memberUser.id, "non_existent_proj_id")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("5. requireProjectRole", () => {
    it("allows assigned DEVELOPER when DEVELOPER role is allowed", async () => {
      const result = await requireProjectRole(memberUser.id, testProject.id, [
        ProjectRole.DEVELOPER,
        ProjectRole.PROJECT_MANAGER,
      ]);
      expect(result.role).toBe("DEVELOPER");
      expect(result.isOrgAdmin).toBe(false);
    });

    it("prevents VIEWER from performing mutation actions requiring DEVELOPER", async () => {
      await expect(
        requireProjectRole(viewerUser.id, testProject.id, [
          ProjectRole.DEVELOPER,
          ProjectRole.PROJECT_MANAGER,
        ])
      ).rejects.toThrow(AuthorizationError);
    });

    it("allows Organization OWNER with inherited PROJECT_MANAGER authority", async () => {
      const result = await requireProjectRole(ownerUser.id, testProject.id, [
        ProjectRole.PROJECT_MANAGER,
      ]);
      expect(result.role).toBe("PROJECT_MANAGER");
      expect(result.isOrgAdmin).toBe(true);
    });
  });
});
