import { requireAuth, requireProjectRole } from "@/lib/utils/permissions";
import { taskService } from "@/lib/services/taskService";
import { updateTaskStatusSchema } from "@/lib/validations/taskSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, taskId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const { status } = updateTaskStatusSchema.parse(body);

    const updated = await taskService.updateTaskStatus(projectId, taskId, user.id, status);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  return POST(request, { params });
}
