import { requireAuth, requireProjectMember, requireProjectRole } from "@/lib/utils/permissions";
import { requirementService } from "@/lib/services/requirementService";
import { updateRequirementSchema } from "@/lib/validations/requirementSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function GET(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, requirementId } = params;

    await requireProjectMember(user.id, projectId);
    const requirement = await requirementService.getRequirementById(projectId, requirementId);

    return successResponse(requirement);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, requirementId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = updateRequirementSchema.parse(body);

    const updated = await requirementService.updateRequirement(
      projectId,
      requirementId,
      user.id,
      validated
    );
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, requirementId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await requirementService.deleteRequirement(projectId, requirementId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
