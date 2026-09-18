import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ConflictError, AuthorizationError } from "@/lib/auth/errors";

/**
 * Converts a string into a URL-safe slug.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Organization Service Layer
 */
export const organizationService = {
  /**
   * Retrieves all organizations that the given user belongs to.
   */
  async getUserOrganizations(userId) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                projects: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      logo: m.organization.logo,
      role: m.role,
      memberCount: m.organization._count.members,
      projectCount: m.organization._count.projects,
      joinedAt: m.joinedAt,
      createdAt: m.organization.createdAt,
      updatedAt: m.organization.updatedAt,
    }));
  },

  /**
   * Creates a new organization and assigns the creator as OWNER.
   */
  async createOrganization(userId, data) {
    let slug = data.slug || slugify(data.name);

    // If slug is empty or collision, append unique short hex
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      if (data.slug) {
        throw new ConflictError(`Organization slug '${slug}' is already taken.`);
      }
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    return await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug,
          logo: data.logo || null,
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      return org;
    });
  },

  /**
   * Retrieves organization details along with member list and projects summary.
   */
  async getOrganizationById(organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        projects: {
          select: {
            id: true,
            name: true,
            key: true,
            status: true,
            createdAt: true,
          },
          orderBy: { updatedAt: "desc" },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundError("Organization not found.");
    }

    return org;
  },

  /**
   * Updates organization name, slug, or logo.
   */
  async updateOrganization(organizationId, data) {
    if (data.slug) {
      const existing = await prisma.organization.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== organizationId) {
        throw new ConflictError(`Slug '${data.slug}' is already in use by another organization.`);
      }
    }

    return await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.logo !== undefined && { logo: data.logo || null }),
      },
    });
  },

  /**
   * Adds or invites a user to the organization.
   */
  async addOrganizationMember(organizationId, data) {
    let targetUserId = data.userId;

    if (!targetUserId && data.email) {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (!user) {
        throw new NotFoundError(`User with email '${data.email}' does not exist.`);
      }
      targetUserId = user.id;
    }

    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictError("User is already a member of this organization.");
    }

    return await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: targetUserId,
        role: data.role || "MEMBER",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  },

  /**
   * Removes a member from the organization and revokes their project memberships in this organization.
   */
  async removeOrganizationMember(organizationId, targetUserId, requestingUserId) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundError("User is not a member of this organization.");
    }

    // Prevent removing the sole OWNER
    if (membership.role === "OWNER") {
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId,
          role: "OWNER",
        },
      });

      if (ownerCount <= 1) {
        throw new AuthorizationError("Cannot remove the sole owner of the organization.");
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Clean up project memberships for this user in projects belonging to this organization
      const orgProjects = await tx.project.findMany({
        where: { organizationId },
        select: { id: true },
      });

      const projectIds = orgProjects.map((p) => p.id);
      if (projectIds.length > 0) {
        await tx.projectMember.deleteMany({
          where: {
            projectId: { in: projectIds },
            userId: targetUserId,
          },
        });
      }

      // Delete the organization membership
      return await tx.organizationMember.delete({
        where: {
          organizationId_userId: {
            organizationId,
            userId: targetUserId,
          },
        },
      });
    });
  },
};
