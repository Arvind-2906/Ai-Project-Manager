import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { sprintService } from "@/lib/services/sprintService";
import { createSprintSchema } from "@/lib/validations/sprintSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);
    const sprints = await sprintService.getProjectSprints(projectId);

    return successResponse(sprints);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const body = await request.json();
    const validated = createSprintSchema.parse(body);

    const sprint = await sprintService.createSprint(projectId, user.id, validated);
    return successResponse(sprint, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
