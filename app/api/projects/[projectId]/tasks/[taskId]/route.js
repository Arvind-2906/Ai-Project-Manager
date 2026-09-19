import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { taskService } from "@/lib/services/taskService";
import { updateTaskSchema } from "@/lib/validations/taskSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, taskId } = params;

    await requireProjectMember(user.id, projectId);
    const task = await taskService.getTaskById(projectId, taskId);

    return successResponse(task);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, taskId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = updateTaskSchema.parse(body);

    const updated = await taskService.updateTask(projectId, taskId, user.id, validated);
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, taskId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await taskService.deleteTask(projectId, taskId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
