import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { epicService } from "@/lib/services/epicService";
import { createEpicSchema } from "@/lib/validations/workBreakdownSchemas";
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
      search: searchParams.get("search") || undefined,
    };

    const epics = await epicService.getProjectEpics(projectId, filters);
    return successResponse(epics);
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
    const validated = createEpicSchema.parse(body);

    const epic = await epicService.createEpic(projectId, user.id, validated);
    return successResponse(epic, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
