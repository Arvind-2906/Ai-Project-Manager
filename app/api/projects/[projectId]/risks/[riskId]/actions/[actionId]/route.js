import { requireAuth, requireProjectRole } from "@/lib/utils/permissions";
import { riskService } from "@/lib/services/riskService";
import { updateRiskActionSchema } from "@/lib/validations/riskSchemas";
import { handleApiError, successResponse } from "@/lib/auth/errors";

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAuth(request);
    const { projectId, riskId, actionId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER", "DEVELOPER"]);
    const body = await request.json();
    const validated = updateRiskActionSchema.parse(body);

    const updated = await riskService.updateRiskAction(
      projectId,
      riskId,
      actionId,
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
    const { projectId, riskId, actionId } = params;

    await requireProjectRole(user.id, projectId, ["PROJECT_MANAGER"]);
    const result = await riskService.deleteRiskAction(projectId, riskId, actionId, user.id);

    return successResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
