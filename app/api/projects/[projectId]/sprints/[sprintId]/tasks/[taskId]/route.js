import { requireAuth, requireProjectRole } from "@/lib/utils/permissions";
import { sprintService } from "@/lib/services/sprintService";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, sprintId, taskId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const result = await sprintService.removeTaskFromSprint(projectId, sprintId, user.id, taskId);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
