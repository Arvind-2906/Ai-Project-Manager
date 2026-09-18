import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { projectService } from "@/lib/services/projectService";
import { updateProjectSchema } from "@/lib/validations/projectSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);
    const project = await projectService.getProjectById(projectId);

    return successResponse(project);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    const updated = await projectService.updateProject(projectId, user.id, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await projectService.deleteProject(projectId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
