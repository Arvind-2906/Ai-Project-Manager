import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ConflictError, AuthorizationError } from "@/lib/auth/errors";
import { logActivity } from "./activityService";

/**
 * Project Service Layer
 */
export const projectService = {
  /**
   * Retrieves all projects accessible to the user across their organizations.
   * A user can access a project if they are an assigned ProjectMember OR
   * if they are an OWNER/ADMIN of the parent organization.
   */
  async getUserProjects(userId, organizationId = null) {
    // 1. Get organizations where user is OWNER or ADMIN
    const adminOrgs = await prisma.organizationMember.findMany({
      where: {
        userId,
        role: { in: ["OWNER", "ADMIN"] },
        ...(organizationId ? { organizationId } : {}),
      },
      select: { organizationId: true },
    });
    const adminOrgIds = adminOrgs.map((o) => o.organizationId);

    // 2. Fetch projects matching direct membership OR admin organization ownership
    const projects = await prisma.project.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        OR: [
          { members: { some: { userId } } },
          { organizationId: { in: adminOrgIds } },
        ],
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
            sprints: true,
            risks: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return projects.map((p) => {
      const isOrgAdmin = adminOrgIds.includes(p.organizationId);
      const projectRole = p.members[0]?.role || (isOrgAdmin ? "PROJECT_MANAGER" : "VIEWER");

      return {
        id: p.id,
        organizationId: p.organizationId,
        organization: p.organization,
        name: p.name,
        key: p.key,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        targetDate: p.targetDate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        userRole: projectRole,
        isOrgAdmin,
        counts: {
          members: p._count.members,
          tasks: p._count.tasks,
          sprints: p._count.sprints,
          risks: p._count.risks,
        },
      };
    });
  },

  /**
   * Creates a new project in the specified organization.
   * Caller must be OWNER, ADMIN, or PROJECT_MANAGER in that organization.
   */
  async createProject(userId, data) {
    const { organizationId, name, key, description, status, startDate, targetDate } = data;

    // Check organization membership & role
    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!orgMember) {
      throw new AuthorizationError("You are not a member of the target organization.");
    }

    if (!["OWNER", "ADMIN", "PROJECT_MANAGER"].includes(orgMember.role)) {
      throw new AuthorizationError(
        "Only Organization Owners, Admins, or Project Managers can create new projects."
      );
    }

    // Ensure key is globally or organizationally unique
    const existingKey = await prisma.project.findUnique({
      where: { key },
    });

    if (existingKey) {
      throw new ConflictError(`Project key '${key}' is already in use.`);
    }

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          organizationId,
          name,
          key,
          description: description || null,
          status: status || "PLANNING",
          startDate: startDate ? new Date(startDate) : null,
          targetDate: targetDate ? new Date(targetDate) : null,
          createdById: userId,
          members: {
            create: {
              userId,
              role: "PROJECT_MANAGER",
            },
          },
        },
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      return created;
    });

    // Log activity
    await logActivity({
      projectId: project.id,
      userId,
      actorType: "USER",
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: project.id,
      metadata: { name: project.name, key: project.key },
    });

    return project;
  },

  /**
   * Retrieves full details for a single project.
   */
  async getProjectById(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: {
            requirements: true,
            epics: true,
            tasks: true,
            sprints: true,
            risks: true,
            documents: true,
            agents: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    return project;
  },

  /**
   * Updates project metadata (name, description, status, timeline dates).
   */
  async updateProject(projectId, userId, data) {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.targetDate !== undefined && {
          targetDate: data.targetDate ? new Date(data.targetDate) : null,
        }),
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "PROJECT_UPDATED",
      entityType: "PROJECT",
      entityId: projectId,
      metadata: data,
    });

    return updated;
  },

  /**
   * Deletes a project and its associated resources.
   */
  async deleteProject(projectId, userId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, key: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    await logActivity({
      projectId,
      userId,
      actorType: "USER",
      action: "PROJECT_DELETED",
      entityType: "PROJECT",
      entityId: projectId,
      metadata: { key: project.key, name: project.name },
    });

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { id: projectId, key: project.key, deleted: true };
  },

  /**
   * Lists all assigned members of a project.
   */
  async getProjectMembers(projectId) {
    const exists = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundError("Project not found.");
    }

    return await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
  },

  /**
   * Adds or updates a user's role on the project.
   */
  async addProjectMember(projectId, requestingUserId, { userId, email, role }) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true },
    });

    if (!project) {
      throw new NotFoundError("Project not found.");
    }

    let targetUserId = userId;
    if (!targetUserId && email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new NotFoundError(`Target user with email '${email}' not found.`);
      }
      targetUserId = user.id;
    } else {
      const user = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user) {
        throw new NotFoundError("Target user not found.");
      }
    }

    // Ensure the user belongs to the parent organization
    const orgMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: project.organizationId,
          userId: targetUserId,
        },
      },
    });

    if (!orgMembership) {
      // Auto-add to parent organization as MEMBER if not yet present
      await prisma.organizationMember.create({
        data: {
          organizationId: project.organizationId,
          userId: targetUserId,
          role: "MEMBER",
        },
      });
    }

    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
      update: {
        role: role || "DEVELOPER",
      },
      create: {
        projectId,
        userId: targetUserId,
        role: role || "DEVELOPER",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await logActivity({
      projectId,
      userId: requestingUserId,
      actorType: "USER",
      action: "PROJECT_MEMBER_ADDED",
      entityType: "PROJECT_MEMBER",
      entityId: member.id,
      metadata: { targetUserId, role: member.role },
    });

    return member;
  },

  /**
   * Removes an assigned member from a project.
   */
  async removeProjectMember(projectId, requestingUserId, targetUserId) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError("User is not a member of this project.");
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    await logActivity({
      projectId,
      userId: requestingUserId,
      actorType: "USER",
      action: "PROJECT_MEMBER_REMOVED",
      entityType: "PROJECT_MEMBER",
      entityId: member.id,
      metadata: { removedUserId: targetUserId },
    });

    return { removed: true, projectId, userId: targetUserId };
  },
};
