import {
  requireAuth,
  requireOrganizationMember,
  requireOrganizationRole,
} from "@/lib/utils/permissions";
import { projectService } from "@/lib/services/projectService";
import { createProjectSchema } from "@/lib/validations/projectSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { organizationId } = params;

    await requireOrganizationMember(user.id, organizationId);
    const projects = await projectService.getUserProjects(user.id, organizationId);

    return successResponse(projects);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { organizationId } = params;

    await requireOrganizationRole(user.id, organizationId, ["OWNER", "ADMIN", "PROJECT_MANAGER"]);
    const body = await request.json();
    const validated = createProjectSchema.parse({
      ...body,
      organizationId,
    });

    const project = await projectService.createProject(user.id, validated);
    return successResponse(project, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
