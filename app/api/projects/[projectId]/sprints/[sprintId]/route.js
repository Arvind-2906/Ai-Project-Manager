import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { sprintService } from "@/lib/services/sprintService";
import { updateSprintSchema } from "@/lib/validations/sprintSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, sprintId } = params;

    await requireProjectMember(user.id, projectId);
    const sprint = await sprintService.getSprintById(projectId, sprintId);

    return successResponse(sprint);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, sprintId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const body = await request.json();
    const validated = updateSprintSchema.parse(body);

    const updated = await sprintService.updateSprint(projectId, sprintId, user.id, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, sprintId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await sprintService.deleteSprint(projectId, sprintId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
