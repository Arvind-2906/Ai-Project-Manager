import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { epicService } from "@/lib/services/epicService";
import { updateEpicSchema } from "@/lib/validations/workBreakdownSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, epicId } = params;

    await requireProjectMember(user.id, projectId);
    const epic = await epicService.getEpicById(projectId, epicId);

    return successResponse(epic);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, epicId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = updateEpicSchema.parse(body);

    const updated = await epicService.updateEpic(projectId, epicId, user.id, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, epicId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await epicService.deleteEpic(projectId, epicId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
