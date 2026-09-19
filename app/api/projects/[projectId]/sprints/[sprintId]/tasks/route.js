import { requireAuth, requireProjectRole } from "@/lib/utils/permissions";
import { sprintService } from "@/lib/services/sprintService";
import { addSprintTasksSchema } from "@/lib/validations/sprintSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, sprintId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = addSprintTasksSchema.parse(body);

    const taskIds = validated.taskIds || (validated.taskId ? [validated.taskId] : []);
    const updatedSprint = await sprintService.addTasksToSprint(
      projectId,
      sprintId,
      user.id,
      taskIds
    );

    return successResponse(updatedSprint, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
