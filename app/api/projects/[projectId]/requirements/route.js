import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { requirementService } from "@/lib/services/requirementService";
import { createRequirementSchema } from "@/lib/validations/requirementSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId } = params;

    await requireProjectMember(user.id, projectId);

    const { searchParams } = new URL(request.url);
    const filters = {
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const requirements = await requirementService.getProjectRequirements(projectId, filters);
    return successResponse(requirements);
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
    const validated = createRequirementSchema.parse(body);

    const requirement = await requirementService.createRequirement(projectId, user.id, validated);
    return successResponse(requirement, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
