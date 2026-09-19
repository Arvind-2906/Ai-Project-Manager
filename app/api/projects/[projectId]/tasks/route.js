import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { taskService } from "@/lib/services/taskService";
import { createTaskSchema } from "@/lib/validations/taskSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      type: searchParams.get("type") || undefined,
      assigneeId: searchParams.get("assigneeId") || undefined,
      userStoryId: searchParams.get("userStoryId") || undefined,
      parentTaskId: searchParams.get("parentTaskId") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const pagination = {
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 50,
    };

    const { tasks, pagination: meta } = await taskService.getProjectTasks(
      projectId,
      filters,
      pagination
    );
    return successResponse(tasks, 200, meta);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = createTaskSchema.parse(body);

    const task = await taskService.createTask(projectId, user.id, validated);
    return successResponse(task, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
