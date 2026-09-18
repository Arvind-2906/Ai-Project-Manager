import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from "@/lib/auth/errors";

export const OrganizationRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
};

export const ProjectRole = {
  PROJECT_MANAGER: "PROJECT_MANAGER",
  DEVELOPER: "DEVELOPER",
  DESIGNER: "DESIGNER",
  TESTER: "TESTER",
  VIEWER: "VIEWER",
};

/**
 * 1. requireAuth(request)
 * Ensures the incoming request has an active, valid Better Auth session.
 *
 * @param {Request} request Next.js incoming request
 * @returns {Promise<{ user: Object, session: Object }>}
 * @throws {AuthenticationError} If session is missing or expired
 */
export async function requireAuth(request) {
  const session = await getSession(request);
  if (!session || !session.user) {
    throw new AuthenticationError("Authentication required. Please sign in.");
  }
  return session;
}

/**
 * 2. requireOrganizationMember(userId, organizationId)
 * Verifies that the user belongs to the specified organization.
 *
 * @param {string} userId
 * @param {string} organizationId
 * @returns {Promise<{ member: Object, organization: Object }>}
 * @throws {NotFoundError} If organization does not exist
 * @throws {AuthorizationError} If user is not a member of the organization
 */
export async function requireOrganizationMember(userId, organizationId) {
  if (!userId || !organizationId) {
    throw new AuthorizationError("User ID and Organization ID are required.");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!organization) {
    throw new NotFoundError("Organization not found.");
  }

  const member = organization.members[0];
  if (!member) {
    throw new AuthorizationError("You are not a member of this organization.");
  }

  return { member, organization };
}

/**
 * 3. requireOrganizationRole(userId, organizationId, allowedRoles)
 * Verifies that the user holds one of the specified allowed roles within the organization.
 * Note: Organization OWNER always satisfies all role requirements.
 *
 * @param {string} userId
 * @param {string} organizationId
 * @param {string[]} allowedRoles List of permitted OrganizationRoles
 * @returns {Promise<{ member: Object, organization: Object }>}
 * @throws {AuthorizationError} If user does not hold an allowed role
 */
export async function requireOrganizationRole(userId, organizationId, allowedRoles = []) {
  const { member, organization } = await requireOrganizationMember(userId, organizationId);

  // Organization OWNER has superuser privilege for the organization
  if (member.role === OrganizationRole.OWNER) {
    return { member, organization };
  }

  const normalizedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());
  if (!normalizedAllowedRoles.includes(member.role)) {
    throw new AuthorizationError(
      `Insufficient organization permissions. Required: [${allowedRoles.join(
        ", "
      )}], current role: ${member.role}`
    );
  }

  return { member, organization };
}

/**
 * 4. requireProjectMember(userId, projectId)
 * Verifies that the user is a member of the project team, or holds
 * an administrative role (OWNER/ADMIN) in the project's parent organization.
 *
 * @param {string} userId
 * @param {string} projectId
 * @returns {Promise<{ project: Object, projectMember: Object | null, orgMember: Object | null }>}
 * @throws {NotFoundError} If project does not exist
 * @throws {AuthorizationError} If user is not authorized for the project
 */
export async function requireProjectMember(userId, projectId) {
  if (!userId || !projectId) {
    throw new AuthorizationError("User ID and Project ID are required.");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
      members: {
        where: { userId },
      },
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found.");
  }

  const orgMember = project.organization.members[0] || null;
  const projectMember = project.members[0] || null;

  // 1. Direct project membership
  if (projectMember) {
    return { project, projectMember, orgMember };
  }

  // 2. Implicit access granted if user is OWNER or ADMIN of parent organization
  if (orgMember && (orgMember.role === OrganizationRole.OWNER || orgMember.role === OrganizationRole.ADMIN)) {
    return { project, projectMember: null, orgMember };
  }

  throw new AuthorizationError("You do not have access to this project.");
}

/**
 * 5. requireProjectRole(userId, projectId, allowedRoles)
 * Enforces project-level role permissions (e.g. preventing VIEWER from modifying tasks).
 * Organization OWNER and ADMIN automatically possess full project management authorization.
 *
 * @param {string} userId
 * @param {string} projectId
 * @param {string[]} allowedRoles List of permitted ProjectRoles
 * @returns {Promise<{ project: Object, role: string, isOrgAdmin: boolean }>}
 * @throws {AuthorizationError} If user lacks required project role
 */
export async function requireProjectRole(userId, projectId, allowedRoles = []) {
  const { project, projectMember, orgMember } = await requireProjectMember(userId, projectId);

  // Organization OWNER or ADMIN inherits full PROJECT_MANAGER rights
  if (orgMember && (orgMember.role === OrganizationRole.OWNER || orgMember.role === OrganizationRole.ADMIN)) {
    return { project, role: ProjectRole.PROJECT_MANAGER, isOrgAdmin: true };
  }

  if (!projectMember) {
    throw new AuthorizationError("You are not an assigned member of this project.");
  }

  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  if (!normalizedAllowed.includes(projectMember.role)) {
    throw new AuthorizationError(
      `Insufficient project permissions. Required role: [${allowedRoles.join(
        ", "
      )}], your role: ${projectMember.role}`
    );
  }

  return { project, role: projectMember.role, isOrgAdmin: false };
}
